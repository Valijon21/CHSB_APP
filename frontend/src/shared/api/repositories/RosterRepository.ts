import type {
  RosterLookupRequest,
  RosterLookupResult,
  StudentRosterRecord,
} from '../../../entities/roster/model';

export interface RosterRepository {
  lookup(request: RosterLookupRequest): Promise<RosterLookupResult>;
  getRosterRecordById(tenantId: string, recordId: string): Promise<StudentRosterRecord | null>;
  getRosterByClass(tenantId: string, classGroupId: string): Promise<StudentRosterRecord[]>;
}
