import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Button,
    Stack,
    TextField,
    Typography,
    Autocomplete,
    CircularProgress,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
} from "@mui/material";
import { toast } from "sonner";
import AgendamentoPresenter from "../../../presenters/AgendamentoPresenter";
import {
    AgendamentoEditSchema,
    AgendamentoEditSchemaType,
} from "../../../schema/AgendamentoEditSchema";
import ClientesGetAll from "../../../useCases/clientes/ClientesGetAll";
import UsuarioGetAll from "../../../useCases/usuario/usuarioGetAll";
import ServicoGetAll from "../../../useCases/servico/ServicoGetAll";
import AgendamentoUpdate from "../../../useCases/agendamento/AgendamentoUpdate";
import { StatusAgendamento } from "../../../enum/StatusAgendamento";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

type AgendamentoEditFormProps = {
    agendamento: AgendamentoPresenter;
    idEmpresa: string;
    onSuccess?: () => void;
    onCancel?: () => void;
};

export default function AgendamentoEditForm({
    agendamento,
    idEmpresa,
    onSuccess,
    onCancel,
}: AgendamentoEditFormProps) {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
    } = useForm<AgendamentoEditSchemaType>({
        resolver: zodResolver(AgendamentoEditSchema),
    });

    const [clientes, setClientes] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [servicos, setServicos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    console.log(agendamento);

    useEffect(() => {
        async function fetchData() {
            try {
                const [clientesData, usuariosData, servicosData] = await Promise.all([
                    new ClientesGetAll().execute(idEmpresa),
                    new UsuarioGetAll().execute(idEmpresa),
                    new ServicoGetAll().execute(idEmpresa),
                ]);
                setClientes(clientesData);
                setUsuarios(usuariosData);
                setServicos(servicosData);
            } catch (err) {
                console.error(err);
                toast.error("Erro ao carregar dados de seleção");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [idEmpresa]);

    useEffect(() => {
        if (!agendamento) return;

        reset({
            dataHoraInicio: agendamento.dataHoraInicio
                ? new Date(agendamento.dataHoraInicio)
                : new Date(),
            dataHoraFim: agendamento.dataHoraFim
                ? new Date(agendamento.dataHoraFim)
                : new Date(),
            observacao: agendamento.observacao ?? "",
            idCliente: agendamento.idCliente,
            idUsuario: agendamento.idUsuario,
            // 🔥 Mapeia os IDs dos serviços vinculados ao agendamento
            idServico: agendamento.agendamentoServico
                ? agendamento.agendamentoServico.map((s) => s.idServico)
                : [],
            valorTotal: agendamento.valorTotal ?? 0,
            statusAgendamento:
                agendamento.statusAgendamento ?? StatusAgendamento.PENDENTE,
        });
    }, [agendamento, reset]);


    const onSubmit = async (data: AgendamentoEditSchemaType) => {
        try {
            const payload = {
                ...data,
                dataHoraInicio: data.dataHoraInicio.toISOString(),
                dataHoraFim: data.dataHoraFim.toISOString(),
            };

            await new AgendamentoUpdate().execute(
                idEmpresa,
                agendamento.idAgendamento!,
                payload
            );

            toast.success("Agendamento atualizado com sucesso!");
            onSuccess?.();
        } catch (err: any) {
            console.error("Erro ao atualizar agendamento:", err);
            toast.error("Erro ao atualizar agendamento. Tente novamente.");
        }
    };

    return (
        <>
            <Typography variant="h5" mb={3} textAlign="center">
                Editar Agendamento
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={3}>
                    <Controller
                        name="idCliente"
                        control={control}
                        render={({ field }) => (
                            <Autocomplete
                                {...field}
                                options={clientes}
                                loading={loading}
                                getOptionLabel={(option) => option.nome || ""}
                                onChange={(_, value) => field.onChange(value?.id ?? null)}
                                value={clientes.find((c) => c.id === field.value) || null}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Cliente"
                                        error={!!errors.idCliente}
                                        helperText={errors.idCliente?.message}
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {loading ? <CircularProgress size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        )}
                    />

                    <Controller
                        name="idUsuario"
                        control={control}
                        render={({ field }) => (
                            <Autocomplete
                                {...field}
                                options={usuarios}
                                loading={loading}
                                getOptionLabel={(option) => option.nomeUsuario || ""}
                                onChange={(_, value) => field.onChange(value?.id ?? null)}
                                value={usuarios.find((u) => u.id === field.value) || null}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Funcionário"
                                        error={!!errors.idUsuario}
                                        helperText={errors.idUsuario?.message}
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {loading ? <CircularProgress size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        )}
                    />

                    <Controller
                        name="idServico"
                        control={control}
                        render={({ field }) => (
                            <Autocomplete
                                {...field}
                                multiple
                                options={servicos}
                                loading={loading}
                                getOptionLabel={(option) => option.descricao || ""}
                                onChange={(_, values) => field.onChange(values.map((v) => v.id))}
                                value={servicos.filter((s) =>
                                    field.value?.includes(s.id as number)
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Serviços"
                                        error={!!errors.idServico}
                                        helperText={errors.idServico?.message}
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {loading ? <CircularProgress size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        )}
                    />

                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Controller
                            name="dataHoraInicio"
                            control={control}
                            render={({ field }) => (
                                <DateTimePicker
                                    label="Início"
                                    ampm={false}
                                    value={field.value ? new Date(field.value) : null}
                                    onChange={(date) => field.onChange(date)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            error={!!errors.dataHoraInicio}
                                            helperText={errors.dataHoraInicio?.message}
                                        />
                                    )}
                                />
                            )}
                        />

                        <Controller
                            name="dataHoraFim"
                            control={control}
                            render={({ field }) => (
                                <DateTimePicker
                                    label="Fim"
                                    ampm={false}
                                    value={field.value ? new Date(field.value) : null}
                                    onChange={(date) => field.onChange(date)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            error={!!errors.dataHoraFim}
                                            helperText={errors.dataHoraFim?.message}
                                        />
                                    )}
                                />
                            )}
                        />
                    </LocalizationProvider>


                    <TextField
                        label="Valor Total"
                        type="number"
                        {...register("valorTotal", { valueAsNumber: true })}
                        fullWidth
                        error={!!errors.valorTotal}
                        helperText={errors.valorTotal?.message}
                    />

                    <TextField
                        label="Observação"
                        {...register("observacao")}
                        multiline
                        rows={3}
                        fullWidth
                    />

                    <Controller
                        name="statusAgendamento"
                        control={control}
                        render={({ field }) => (
                            <FormControl fullWidth error={!!errors.statusAgendamento}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    {...field}
                                    label="Status"
                                    value={field.value ?? StatusAgendamento.PENDENTE}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                >
                                    <MenuItem value={StatusAgendamento.PENDENTE}>Pendente</MenuItem>
                                    <MenuItem value={StatusAgendamento.FINALIZADO}>Finalizado</MenuItem>
                                    <MenuItem value={StatusAgendamento.CANCELADO}>Cancelado</MenuItem>
                                </Select>
                                {errors.statusAgendamento && (
                                    <Typography color="error" variant="caption">
                                        {errors.statusAgendamento.message}
                                    </Typography>
                                )}
                            </FormControl>
                        )}
                    />


                    <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
                        <Button variant="outlined" color="inherit" onClick={onCancel}>
                            Cancelar
                        </Button>
                        <Button variant="contained" color="primary" type="submit">
                            Atualizar
                        </Button>
                    </Stack>
                </Stack>
            </form>
        </>
    );
}
