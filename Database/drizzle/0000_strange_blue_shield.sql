CREATE TABLE "usuarios" (
	"id_usuario" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "usuarios_id_usuario_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"nombre_usuario" varchar(100) NOT NULL,
	"email_usuario" varchar(100) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"fecha_creacion" timestamp with time zone DEFAULT now() NOT NULL,
	"ult_actualizacion" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_usuario_unique" UNIQUE("email_usuario")
);
--> statement-breakpoint
CREATE TABLE "categorias_padre" (
	"id_categoria_padre" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categorias_padre_id_categoria_padre_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"nombre_categoria" varchar(100) NOT NULL,
	"descripcion_categoria" text,
	"activo" boolean DEFAULT true NOT NULL,
	"fecha_creacion" timestamp with time zone DEFAULT now() NOT NULL,
	"fecha_modificacion" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categorias_padre_nombre_categoria_unique" UNIQUE("nombre_categoria")
);
--> statement-breakpoint
CREATE TABLE "subcategorias" (
	"id_subcategoria" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subcategorias_id_subcategoria_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"id_categoria_padre" bigint NOT NULL,
	"nombre_subcategoria" varchar(100) NOT NULL,
	"descripcion_subcategoria" text,
	"activo" boolean DEFAULT true NOT NULL,
	"fecha_creacion" timestamp with time zone DEFAULT now() NOT NULL,
	"fecha_modificacion" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productos" (
	"id_producto" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "productos_id_producto_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"id_subcategoria" bigint NOT NULL,
	"nombre_producto" varchar(120) NOT NULL,
	"descripcion_producto" text,
	"precio_producto" numeric(12, 2) NOT NULL,
	"stock_producto" integer DEFAULT 0 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"fecha_creacion" timestamp with time zone DEFAULT now() NOT NULL,
	"fecha_modificacion" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transacciones" (
	"id_transaccion" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "transacciones_id_transaccion_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"id_usuario" bigint NOT NULL,
	"valor_transaccion" numeric(12, 2) NOT NULL,
	"fecha_transaccion" timestamp with time zone DEFAULT now() NOT NULL,
	"estado" varchar(20) DEFAULT 'PENDIENTE' NOT NULL,
	"hash" varchar(255) NOT NULL,
	"metodo_pago" varchar(20) NOT NULL,
	"fecha_creacion" timestamp with time zone DEFAULT now() NOT NULL,
	"ult_actualizacion" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facturacion" (
	"id_factura" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "facturacion_id_factura_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"id_transaccion" bigint NOT NULL,
	"id_usuario" bigint NOT NULL,
	"numero_factura" varchar(50) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"impuesto" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"detalles" jsonb NOT NULL,
	"estado" varchar(20) DEFAULT 'PENDIENTE' NOT NULL,
	"fecha_emision" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "facturacion_id_transaccion_unique" UNIQUE("id_transaccion"),
	CONSTRAINT "facturacion_numero_factura_unique" UNIQUE("numero_factura")
);
--> statement-breakpoint
CREATE TABLE "anomalias_transacciones" (
	"id_anomalia" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "anomalias_transacciones_id_anomalia_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"id_transaccion" bigint NOT NULL,
	"tipo_anomalia" varchar(50) NOT NULL,
	"nivel_riesgo" varchar(20) DEFAULT 'CRITICO' NOT NULL,
	"cantidad_transacciones" integer NOT NULL,
	"ventana_segundos" integer NOT NULL,
	"transacciones_involucradas" jsonb NOT NULL,
	"fecha_creacion" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subcategorias" ADD CONSTRAINT "subcategorias_id_categoria_padre_categorias_padre_id_categoria_padre_fk" FOREIGN KEY ("id_categoria_padre") REFERENCES "public"."categorias_padre"("id_categoria_padre") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_id_subcategoria_subcategorias_id_subcategoria_fk" FOREIGN KEY ("id_subcategoria") REFERENCES "public"."subcategorias"("id_subcategoria") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_id_usuario_usuarios_id_usuario_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facturacion" ADD CONSTRAINT "facturacion_id_transaccion_transacciones_id_transaccion_fk" FOREIGN KEY ("id_transaccion") REFERENCES "public"."transacciones"("id_transaccion") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facturacion" ADD CONSTRAINT "facturacion_id_usuario_usuarios_id_usuario_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anomalias_transacciones" ADD CONSTRAINT "anomalias_transacciones_id_transaccion_transacciones_id_transaccion_fk" FOREIGN KEY ("id_transaccion") REFERENCES "public"."transacciones"("id_transaccion") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_subcategorias_padre" ON "subcategorias" USING btree ("id_categoria_padre");--> statement-breakpoint
CREATE INDEX "idx_productos_subcategoria" ON "productos" USING btree ("id_subcategoria");--> statement-breakpoint
CREATE INDEX "idx_transacciones_usuario_fecha" ON "transacciones" USING btree ("id_usuario","fecha_transaccion");--> statement-breakpoint
CREATE INDEX "idx_transacciones_hash" ON "transacciones" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "idx_facturacion_transaccion" ON "facturacion" USING btree ("id_transaccion");--> statement-breakpoint
CREATE INDEX "idx_facturacion_usuario" ON "facturacion" USING btree ("id_usuario");--> statement-breakpoint
CREATE INDEX "idx_facturacion_fecha" ON "facturacion" USING btree ("fecha_emision");--> statement-breakpoint
CREATE INDEX "idx_anomalias_transaccion" ON "anomalias_transacciones" USING btree ("id_transaccion");--> statement-breakpoint
CREATE INDEX "idx_anomalias_tipo" ON "anomalias_transacciones" USING btree ("tipo_anomalia");--> statement-breakpoint
CREATE INDEX "idx_anomalias_fecha" ON "anomalias_transacciones" USING btree ("fecha_creacion");