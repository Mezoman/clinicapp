import { ClinicSettingsDTO, ClosureDTO, ClosureReasonDTO } from '../../../application/dtos/settings.dto';

export type TabType = 'clinic' | 'hours' | 'notifications' | 'backup' | 'users' | 'services';

export type ClosureFormState = {
    startDate: string;
    endDate: string;
    reason: ClosureReasonDTO;
};

export interface SettingsTabProps {
    settings: ClinicSettingsDTO;
    setSettings: React.Dispatch<React.SetStateAction<ClinicSettingsDTO | null>>;
    onSave: () => Promise<void>;
    saving: boolean;
}

export interface ClinicInfoTabProps extends SettingsTabProps {}

export interface WorkHoursTabProps extends SettingsTabProps {
    closures: ClosureDTO[];
    onAddClosure: () => void;
    onRemoveClosure: (id: string) => Promise<void>;
    toggleWorkingDay: (day: number) => void;
}

export interface NotificationsTabProps {}

export interface BackupTabProps {
    isSuperAdmin: boolean;
    isExporting: boolean;
    isImporting: boolean;
    isResetting: boolean;
    onExport: () => Promise<void>;
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    onShowReset: () => void;
}
