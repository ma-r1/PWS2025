export interface Changelog {
    id: number;
    table_name: string;
    operation_type: string;
    record_id: number;
    timestamp: Date;
    before?: string | null;
    after?: string | null;
    changed_by?: string | null;
}