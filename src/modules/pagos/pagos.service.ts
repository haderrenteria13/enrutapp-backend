import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { Prisma, EstadoOrdenCompra } from '@prisma/client';
import nodemailer from 'nodemailer';
import { PrismaService } from '../../database/prisma.service';
import { CrearOrdenCompraDto } from './dto/crear-orden-compra.dto';

type PurchaseEmailOrder = {
  idOrdenCompra?: string;
  referenciaWompi?: string | null;
  cantidadTiquetes?: number | null;
  total?: Prisma.Decimal | number | null;
  nombrePagador?: string | null;
  correoPagador?: string | null;
  turno?: {
    fecha?: Date | string | null;
    hora?: string | null;
    ruta?: {
      origen?: {
        ubicacion?: { nombreUbicacion?: string | null } | null;
      } | null;
      destino?: {
        ubicacion?: { nombreUbicacion?: string | null } | null;
      } | null;
    } | null;
  } | null;
};

@Injectable()
export class PagosService {
  constructor(private readonly prisma: PrismaService) {}

  private getNestedValue(
    source: Record<string, unknown>,
    path: string,
  ): string {
    const normalizedPath = path.replace(/^data\./, '');
    const segments = normalizedPath.split('.').filter(Boolean);

    let current: unknown = source;
    for (const segment of segments) {
      if (!current || typeof current !== 'object') {
        return '';
      }
      current = (current as Record<string, unknown>)[segment];
    }

    if (current === null || current === undefined) {
      return '';
    }

    if (
      typeof current === 'string' ||
      typeof current === 'number' ||
      typeof current === 'boolean'
    ) {
      return String(current);
    }

    if (current instanceof Date) {
      return current.toISOString();
    }

    return '';
  }

  private validateWebhookSignature(payload: Record<string, unknown>): boolean {
    const signature = payload.signature as Record<string, unknown> | undefined;
    if (!signature) {
      return true;
    }

    const checksum =
      typeof signature.checksum === 'string' ? signature.checksum : null;
    const properties = Array.isArray(signature.properties)
      ? signature.properties.filter(
          (prop): prop is string => typeof prop === 'string',
        )
      : [];

    if (!checksum || properties.length === 0 || !this.wompiIntegritySecret) {
      return false;
    }

    const data = payload.data as Record<string, unknown> | undefined;
    if (!data) {
      return false;
    }

    const timestamp =
      typeof payload.timestamp === 'number'
        ? String(payload.timestamp)
        : typeof payload.timestamp === 'string'
          ? payload.timestamp
          : typeof payload.sent_at === 'number'
            ? String(payload.sent_at)
            : typeof payload.sent_at === 'string'
              ? payload.sent_at
              : '';

    const values = properties
      .map((prop) => this.getNestedValue(data, prop))
      .join('');

    const computedChecksum = createHash('sha256')
      .update(`${values}${timestamp}${this.wompiIntegritySecret}`)
      .digest('hex');

    return computedChecksum === checksum;
  }

  private get wompiApiBaseUrl() {
    return process.env.WOMPI_API_BASE_URL || 'https://production.wompi.co/v1';
  }

  private get wompiPublicKey() {
    return process.env.WOMPI_PUBLIC_KEY || '';
  }

  private get wompiPrivateKey() {
    return process.env.WOMPI_PRIVATE_KEY || '';
  }

  private get wompiIntegritySecret() {
    return process.env.WOMPI_INTEGRITY_SECRET || '';
  }

  private get wompiPhonePrefix() {
    return process.env.WOMPI_PHONE_PREFIX || '57';
  }

  private get smtpHost() {
    return process.env.SMTP_HOST || '';
  }

  private get smtpPort() {
    const port = Number(process.env.SMTP_PORT || 587);
    return Number.isFinite(port) ? port : 587;
  }

  private get smtpSecure() {
    return String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  }

  private get smtpUser() {
    return process.env.SMTP_USER || '';
  }

  private get smtpPass() {
    return process.env.SMTP_PASS || '';
  }

  private get smtpFrom() {
    return process.env.SMTP_FROM || this.smtpUser;
  }

  private get canSendEmailConfirmation() {
    return !!(this.smtpHost && this.smtpUser && this.smtpPass && this.smtpFrom);
  }

  private async enviarCorreoConfirmacionCompra(
    order: PurchaseEmailOrder | null,
  ) {
    const recipient = String(order?.correoPagador || '').trim();
    if (!recipient) {
      return {
        sent: false,
        reason: 'La orden no tiene correo del pagador',
      };
    }

    if (!this.canSendEmailConfirmation) {
      return {
        sent: false,
        recipient,
        reason: 'SMTP no configurado en backend',
      };
    }

    const origen =
      order?.turno?.ruta?.origen?.ubicacion?.nombreUbicacion || 'Origen';
    const destino =
      order?.turno?.ruta?.destino?.ubicacion?.nombreUbicacion || 'Destino';
    const fecha = order?.turno?.fecha
      ? new Date(order.turno.fecha).toLocaleDateString('es-CO')
      : 'Sin fecha';
    const hora = order?.turno?.hora || 'Sin hora';
    const cantidad = Number(order?.cantidadTiquetes || 0);
    const total = Number(order?.total || 0);
    const referencia = String(
      order?.referenciaWompi || order?.idOrdenCompra || 'N/A',
    );
    const nombrePagador = String(order?.nombrePagador || 'Cliente');

    const totalFormateado = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(total);

    const transporter = nodemailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpSecure,
      auth: {
        user: this.smtpUser,
        pass: this.smtpPass,
      },
    });

    const subject = `Compra confirmada - ${referencia}`;
    const text = [
      `Hola ${nombrePagador},`,
      '',
      'Tu compra de pasajes fue confirmada exitosamente.',
      `Ruta: ${origen} - ${destino}`,
      `Fecha: ${fecha}`,
      `Hora: ${hora}`,
      `Cantidad de tiquetes: ${cantidad}`,
      `Total: ${totalFormateado}`,
      `Referencia: ${referencia}`,
      '',
      'Gracias por viajar con Enrutapp.',
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin: 0 0 12px;">Compra confirmada</h2>
        <p>Hola <strong>${nombrePagador}</strong>, tu compra fue confirmada exitosamente.</p>
        <p style="margin: 12px 0;"><strong>Ruta:</strong> ${origen} - ${destino}<br/>
        <strong>Fecha:</strong> ${fecha}<br/>
        <strong>Hora:</strong> ${hora}<br/>
        <strong>Tiquetes:</strong> ${cantidad}<br/>
        <strong>Total:</strong> ${totalFormateado}<br/>
        <strong>Referencia:</strong> ${referencia}</p>
        <p>Gracias por viajar con Enrutapp.</p>
      </div>
    `;

    try {
      const mailResult = await transporter.sendMail({
        from: this.smtpFrom,
        to: recipient,
        subject,
        text,
        html,
      });

      return {
        sent: true,
        recipient,
        messageId: mailResult.messageId,
      };
    } catch (error) {
      console.error('No se pudo enviar correo de confirmación:', error);
      return {
        sent: false,
        recipient,
        reason: 'Error enviando correo de confirmación',
      };
    }
  }

  async crearOrden(dto: CrearOrdenCompraDto, idUsuario: string) {
    const turno = await this.prisma.turnos.findUnique({
      where: { idTurno: dto.idTurno },
      include: {
        ruta: true,
        vehiculo: true,
      },
    });

    if (!turno) {
      throw new HttpException('Turno no encontrado', HttpStatus.NOT_FOUND);
    }

    if (turno.estado !== 'Programado') {
      throw new HttpException(
        'El turno no está disponible para compra',
        HttpStatus.BAD_REQUEST,
      );
    }

    const cantidad = dto.pasajeros.length;
    if (turno.cuposDisponibles < cantidad) {
      throw new HttpException(
        'No hay cupos suficientes para la cantidad de pasajeros seleccionada',
        HttpStatus.BAD_REQUEST,
      );
    }

    const precioUnitario = Number(turno.ruta?.precioBase ?? 0);
    if (!precioUnitario || precioUnitario <= 0) {
      throw new HttpException(
        'La ruta seleccionada no tiene una tarifa válida',
        HttpStatus.BAD_REQUEST,
      );
    }

    const usuario = await this.prisma.usuarios.findUnique({
      where: { idUsuario },
      select: {
        idUsuario: true,
        nombre: true,
        correo: true,
        telefono: true,
      },
    });

    if (!usuario) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    const referenciaWompi = `ENR-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const total = precioUnitario * cantidad;

    const orden = await this.prisma.ordenCompra.create({
      data: {
        idTurno: turno.idTurno,
        idUsuario,
        referenciaWompi,
        cantidadTiquetes: cantidad,
        precioUnitario,
        total,
        correoPagador: dto.correoPagador?.trim() || usuario.correo,
        nombrePagador: usuario.nombre,
        telefonoPagador: usuario.telefono || null,
        pasajeros: dto.pasajeros as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      data: orden,
      message: 'Orden creada exitosamente',
    };
  }

  async getCheckoutConfig(idOrdenCompra: string, idUsuario: string) {
    const orden = await this.prisma.ordenCompra.findFirst({
      where: { idOrdenCompra, idUsuario },
      include: {
        turno: {
          include: {
            ruta: {
              include: {
                origen: { include: { ubicacion: true } },
                destino: { include: { ubicacion: true } },
              },
            },
          },
        },
      },
    });

    if (!orden) {
      throw new HttpException('Orden no encontrada', HttpStatus.NOT_FOUND);
    }

    if (orden.estado !== EstadoOrdenCompra.PENDIENTE) {
      throw new HttpException(
        'La orden ya fue procesada y no puede pagarse de nuevo',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!this.wompiPublicKey || !this.wompiIntegritySecret) {
      throw new HttpException(
        'Falta configurar WOMPI_PUBLIC_KEY y WOMPI_INTEGRITY_SECRET en el backend',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const amountInCents = Math.round(Number(orden.total) * 100);
    const currency = orden.moneda || 'COP';

    const signature = createHash('sha256')
      .update(
        `${orden.referenciaWompi}${amountInCents}${currency}${this.wompiIntegritySecret}`,
      )
      .digest('hex');

    const merchantRes = await fetch(
      `${this.wompiApiBaseUrl}/merchants/${this.wompiPublicKey}`,
    );
    if (!merchantRes.ok) {
      const merchantErrorBody = await merchantRes.text();
      throw new HttpException(
        `No fue posible consultar la configuración del comercio en Wompi (status ${merchantRes.status}). ${merchantErrorBody}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const merchantData = (await merchantRes.json()) as {
      data?: {
        presigned_acceptance?: { acceptance_token?: string };
      };
    };

    const acceptanceToken =
      merchantData?.data?.presigned_acceptance?.acceptance_token;

    if (!acceptanceToken) {
      throw new HttpException(
        'No fue posible obtener el token de aceptación de Wompi',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const normalizedPhone = String(orden.telefonoPagador || '').replace(
      /\D/g,
      '',
    );

    return {
      success: true,
      data: {
        orden: {
          idOrdenCompra: orden.idOrdenCompra,
          referenciaWompi: orden.referenciaWompi,
          total: Number(orden.total),
          cantidadTiquetes: orden.cantidadTiquetes,
        },
        wompi: {
          publicKey: this.wompiPublicKey,
          currency,
          amountInCents,
          reference: orden.referenciaWompi,
          signature,
          acceptanceToken,
          phoneNumberPrefix: this.wompiPhonePrefix,
          customerData: {
            email: orden.correoPagador,
            fullName: orden.nombrePagador,
            phoneNumber: normalizedPhone || undefined,
          },
        },
      },
      message: 'Configuración de checkout generada',
    };
  }

  async confirmarTransaccion(
    idOrdenCompra: string,
    transactionId: string,
    idUsuario?: string,
  ) {
    const orden = await this.prisma.ordenCompra.findFirst({
      where: {
        idOrdenCompra,
        ...(idUsuario ? { idUsuario } : {}),
      },
    });

    if (!orden) {
      throw new HttpException('Orden no encontrada', HttpStatus.NOT_FOUND);
    }

    if (!this.wompiPrivateKey) {
      throw new HttpException(
        'Falta configurar WOMPI_PRIVATE_KEY en el backend',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const wompiRes = await fetch(
      `${this.wompiApiBaseUrl}/transactions/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${this.wompiPrivateKey}`,
        },
      },
    );

    if (!wompiRes.ok) {
      throw new HttpException(
        'No fue posible consultar la transacción en Wompi',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const wompiJson = (await wompiRes.json()) as {
      data?: {
        id?: string;
        status?: string;
        reference?: string;
        amount_in_cents?: number;
        currency?: string;
      };
    };

    const transaction = wompiJson?.data;
    if (!transaction) {
      throw new HttpException(
        'Respuesta inválida de Wompi',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (transaction.reference !== orden.referenciaWompi) {
      throw new HttpException(
        'La referencia de la transacción no coincide con la orden',
        HttpStatus.BAD_REQUEST,
      );
    }

    const expectedAmount = Math.round(Number(orden.total) * 100);
    if (
      Number(transaction.amount_in_cents || 0) !== expectedAmount ||
      transaction.currency !== orden.moneda
    ) {
      throw new HttpException(
        'El monto o moneda de la transacción no coincide con la orden',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.procesarResultadoTransaccion(orden.idOrdenCompra, transaction);
  }

  async getOrden(idOrdenCompra: string, idUsuario: string) {
    const orden = await this.prisma.ordenCompra.findFirst({
      where: { idOrdenCompra, idUsuario },
      include: {
        turno: {
          include: {
            ruta: {
              include: {
                origen: { include: { ubicacion: true } },
                destino: { include: { ubicacion: true } },
              },
            },
          },
        },
        pasajes: true,
      },
    });

    if (!orden) {
      throw new HttpException('Orden no encontrada', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      data: orden,
    };
  }

  async webhookWompi(payload: Record<string, unknown>) {
    if (!this.wompiPrivateKey) {
      return {
        success: false,
        message:
          'Falta configurar WOMPI_PRIVATE_KEY en el backend para procesar webhooks',
      };
    }

    if (!this.validateWebhookSignature(payload)) {
      return {
        success: false,
        message: 'Firma de webhook inválida',
      };
    }

    const data = payload?.data as Record<string, unknown> | undefined;
    const transactionObj = data?.transaction as
      | Record<string, unknown>
      | undefined;

    const transactionId =
      typeof transactionObj?.id === 'string' ? transactionObj.id : null;

    if (!transactionId) {
      return { success: true, message: 'Webhook recibido sin transaction id' };
    }

    const wompiRes = await fetch(
      `${this.wompiApiBaseUrl}/transactions/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${this.wompiPrivateKey}`,
        },
      },
    );

    if (!wompiRes.ok) {
      return { success: false, message: 'No se pudo validar webhook en Wompi' };
    }

    const wompiJson = (await wompiRes.json()) as {
      data?: {
        id?: string;
        status?: string;
        reference?: string;
        amount_in_cents?: number;
        currency?: string;
      };
    };

    const tx = wompiJson.data;
    if (!tx?.reference) {
      return { success: false, message: 'Webhook sin referencia de orden' };
    }

    const orden = await this.prisma.ordenCompra.findUnique({
      where: { referenciaWompi: tx.reference },
    });

    if (!orden) {
      return { success: true, message: 'Orden no encontrada para webhook' };
    }

    await this.procesarResultadoTransaccion(orden.idOrdenCompra, tx);

    return { success: true, message: 'Webhook procesado' };
  }

  private async procesarResultadoTransaccion(
    idOrdenCompra: string,
    transaction: {
      id?: string;
      status?: string;
      reference?: string;
      amount_in_cents?: number;
      currency?: string;
    },
  ) {
    const order = await this.prisma.ordenCompra.findUnique({
      where: { idOrdenCompra },
      include: {
        turno: true,
      },
    });

    if (!order) {
      throw new HttpException('Orden no encontrada', HttpStatus.NOT_FOUND);
    }

    const status = String(transaction.status || '').toUpperCase();

    if (status === 'APPROVED') {
      if (order.estado === EstadoOrdenCompra.APROBADA) {
        return {
          success: true,
          data: order,
          message: 'La orden ya había sido aprobada',
        };
      }

      const pasajeros = Array.isArray(order.pasajeros)
        ? (order.pasajeros as Array<Record<string, unknown>>)
        : [];

      await this.prisma.$transaction(async (tx) => {
        const turnoActual = await tx.turnos.findUnique({
          where: { idTurno: order.idTurno },
        });

        if (!turnoActual) {
          throw new HttpException('Turno no encontrado', HttpStatus.NOT_FOUND);
        }

        if (turnoActual.cuposDisponibles < order.cantidadTiquetes) {
          await tx.ordenCompra.update({
            where: { idOrdenCompra },
            data: {
              estado: EstadoOrdenCompra.RECHAZADA,
              wompiTransactionId: transaction.id,
              wompiStatus: status,
              wompiPayload: transaction as Prisma.InputJsonValue,
            },
          });

          throw new HttpException(
            'La compra fue aprobada, pero no hay cupos suficientes para emitir los pasajes. Contacta soporte.',
            HttpStatus.CONFLICT,
          );
        }

        await tx.pasajes.createMany({
          data: pasajeros.map((pasajero) => {
            const nombre =
              typeof pasajero.nombre === 'string' ? pasajero.nombre : '';
            const apellido =
              typeof pasajero.apellido === 'string' ? pasajero.apellido : '';
            const numeroDocumento =
              typeof pasajero.numeroDocumento === 'string'
                ? pasajero.numeroDocumento
                : '';

            return {
              idTurno: order.idTurno,
              idUsuario: order.idUsuario,
              idOrdenCompra: order.idOrdenCompra,
              nombrePasajero: `${nombre.trim()} ${apellido.trim()}`.trim(),
              documentoPasajero: numeroDocumento.trim(),
              asiento: null,
              precio: order.precioUnitario,
              estado: 'Confirmado',
            };
          }),
        });

        await tx.turnos.update({
          where: { idTurno: order.idTurno },
          data: { cuposDisponibles: { decrement: order.cantidadTiquetes } },
        });

        await tx.ordenCompra.update({
          where: { idOrdenCompra },
          data: {
            estado: EstadoOrdenCompra.APROBADA,
            wompiTransactionId: transaction.id,
            wompiStatus: status,
            wompiPayload: transaction as Prisma.InputJsonValue,
          },
        });
      });

      const updatedOrder = await this.prisma.ordenCompra.findUnique({
        where: { idOrdenCompra },
        include: {
          pasajes: true,
          turno: {
            include: {
              ruta: {
                include: {
                  origen: { include: { ubicacion: true } },
                  destino: { include: { ubicacion: true } },
                },
              },
            },
          },
        },
      });

      const notification =
        await this.enviarCorreoConfirmacionCompra(updatedOrder);

      return {
        success: true,
        data: updatedOrder,
        message: 'Pago aprobado y pasajes emitidos',
        notification,
      };
    }

    const rejectedState =
      status === 'DECLINED'
        ? EstadoOrdenCompra.RECHAZADA
        : status === 'VOIDED'
          ? EstadoOrdenCompra.CANCELADA
          : status === 'ERROR'
            ? EstadoOrdenCompra.RECHAZADA
            : EstadoOrdenCompra.PENDIENTE;

    const updatedOrder = await this.prisma.ordenCompra.update({
      where: { idOrdenCompra },
      data: {
        estado: rejectedState,
        wompiTransactionId: transaction.id,
        wompiStatus: status,
        wompiPayload: transaction as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      data: updatedOrder,
      message: `Transacción en estado ${status || 'PENDING'}`,
    };
  }
}
