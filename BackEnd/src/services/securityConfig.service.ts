export interface SecurityConfig {
  permitirHashExterno: boolean;
  modoEstrictoHMAC: boolean;
  ventanaSegundos: number;
  maxTransaccionesVentana: number;
  umbralManana: number;
  umbralTarde: number;
  umbralNoche: number;
  secretoHMAC: string;
}

export class SecurityConfigService {
  private static instance: SecurityConfigService;

  private config: SecurityConfig = {
    permitirHashExterno: true, // Habilitado por defecto para permitir las pruebas del profesor
    modoEstrictoHMAC: false,   // False permite peticiones JSON plano Y peticiones firmadas
    ventanaSegundos: 3,        // Ventana temporal por defecto: 3 segundos
    maxTransaccionesVentana: 3, // Umbral por defecto: 3 o más transacciones en 3 segundos
    umbralManana: 10,          // Franja 05:00 - 12:00: Max 10 ventas
    umbralTarde: 6,            // Franja 12:00 - 20:00: Max 6 ventas
    umbralNoche: 3,            // Franja 20:00 - 05:00: Max 3 ventas
    secretoHMAC: process.env.HMAC_SECRET || process.env.VITE_HMAC_SECRET || 'appresso-secret-key-32-bytes-secure',
  };

  private constructor() {}

  public static getInstance(): SecurityConfigService {
    if (!SecurityConfigService.instance) {
      SecurityConfigService.instance = new SecurityConfigService();
    }
    return SecurityConfigService.instance;
  }

  public getConfig(): SecurityConfig {
    return { ...this.config };
  }

  public getPublicConfig() {
    return {
      permitirHashExterno: this.config.permitirHashExterno,
      modoEstrictoHMAC: this.config.modoEstrictoHMAC,
      ventanaSegundos: this.config.ventanaSegundos,
      maxTransaccionesVentana: this.config.maxTransaccionesVentana,
      umbralManana: this.config.umbralManana,
      umbralTarde: this.config.umbralTarde,
      umbralNoche: this.config.umbralNoche,
      secretoMasked: this.config.secretoHMAC
        ? `${this.config.secretoHMAC.substring(0, 4)}••••${this.config.secretoHMAC.slice(-4)}`
        : '••••',
    };
  }

  public updateConfig(partial: Partial<SecurityConfig>): SecurityConfig {
    this.config = {
      ...this.config,
      ...partial,
    };
    return this.getConfig();
  }
}

export const securityConfigService = SecurityConfigService.getInstance();
