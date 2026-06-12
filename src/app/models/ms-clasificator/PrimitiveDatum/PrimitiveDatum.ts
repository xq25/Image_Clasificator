export interface PrimitiveDatum {
    id?: number;
    name: string;
    type: PrimitiveDatumType;

}
export enum PrimitiveDatumType {
    STRING,
    INTEGER,
    DOUBLE,
    BOOLEAN,
    DATE,
    DATETIME,
    TIME,
    BINARY,
    TEXT
}
export enum PrimitiveUnit{
    // Sin unidad
    NONE,

    // Peso
    KILOGRAM,
    GRAM,
    MILLIGRAM,
    MICROGRAM,

    // Volumen
    LITER,
    MILLILITER,

    // Longitud
    METER,
    CENTIMETER,
    MILLIMETER,

    // Temperatura
    CELSIUS,
    FAHRENHEIT,

    // Presión
    MMHG,

    // Frecuencia
    BPM,            // Beats Per Minute
    RESPIRATIONS_PER_MINUTE,

    // Saturación
    PERCENT,

    // Tiempo
    SECOND,
    MINUTE,
    HOUR,
    DAY,

    // Glucosa
    MG_DL,
    MMOL_L,

    // Dosis
    UNIT,
    INTERNATIONAL_UNIT,

    // Índices clínicos
    KG_M2
}