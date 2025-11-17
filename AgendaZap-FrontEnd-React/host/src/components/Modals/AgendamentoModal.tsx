import React, { Suspense } from "react";
import { Dialog, DialogContent } from "@mui/material";
import AgendamentoPresenter from "../../presenters/AgendamentoPresenter";
import { tipoEmpresa } from "../../enum/TipoEmpresa";
import AgendamentoEditForm from "../Forms/AgendamentoForm/AgendamentoEditForm";
import AgendamentoForm from "../Forms/AgendamentoForm/AgendamentoForm";

interface AgendamentoModalProps {
    open: boolean;
    onClose: () => void;
    event?: AgendamentoPresenter | null;
    idEmpresa?: string;
    onSuccess?: () => void;
    tipo?: tipoEmpresa; // 👈 usamos o enum aqui
}

const AgendamentoModal: React.FC<AgendamentoModalProps> = ({
    open,
    onClose,
    event,
    idEmpresa = "",
    onSuccess,
    tipo = tipoEmpresa.GENERICO, // 👈 default
}) => {
    const isEditing = Boolean(event?.idAgendamento);

    const handleSuccess = () => {
        onClose();
        onSuccess?.();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
            <DialogContent>
                <Suspense fallback={<div>Carregando...</div>}>
                    {isEditing && event ? (
                        <AgendamentoEditForm
                            agendamento={event}
                            idEmpresa={idEmpresa}
                            onSuccess={handleSuccess}
                            onCancel={onClose}
                        />
                    ) : (
                        <AgendamentoForm
                            data={event?.dataHoraInicio as Date}
                            idEmpresa={idEmpresa}
                            onSuccess={handleSuccess}
                            onCancel={onClose}
                        />
                    )}
                </Suspense>
            </DialogContent>
        </Dialog>
    );
};

export default AgendamentoModal;
