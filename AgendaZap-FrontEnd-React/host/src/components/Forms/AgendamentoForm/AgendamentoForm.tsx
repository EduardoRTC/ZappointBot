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
} from "@mui/material";
import { toast } from "sonner";
import AgendamentoPresenter from "../../../presenters/AgendamentoPresenter";
import { AgendamentoSchema, AgendamentoSchemaType } from "../../../schema/AgendamentoSchema";
import ClientesGetAll from "../../../useCases/clientes/ClientesGetAll";
import UsuarioGetAll from "../../../useCases/usuario/usuarioGetAll";
import ServicoGetAll from "../../../useCases/servico/ServicoGetAll";
import AgendamentoCreate from "../../../useCases/agendamento/AgendamentoCreate";
import FuncionariosPresenter from "../../../presenters/FuncionariosPresenter";
import { ServicosPresenter } from "../../../presenters/ServicosPresenter";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

type TAgendamentoFormProps = {
    idEmpresa: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    data: Date
};

export default function AgendamentoForm({
    idEmpresa,
    onSuccess,
    onCancel,
    data
}: TAgendamentoFormProps) {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
    } = useForm<AgendamentoPresenter>({
        resolver: zodResolver(AgendamentoSchema),
        defaultValues: new AgendamentoPresenter(),
    });

    const [clientes, setClientes] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<FuncionariosPresenter[]>([]);
    const [servicos, setServicos] = useState<ServicosPresenter[]>([]);
    const [loading, setLoading] = useState(true);

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
        if (usuarios.length > 0 && clientes.length > 0) {
            reset({
                dataHoraInicio: data,
            });

        }
    }, [reset, usuarios, clientes, data]);

    const onSubmit = async (data: AgendamentoSchemaType) => {
        try {
            const cleanedData: AgendamentoPresenter = {
                ...data,
                idServico: data.idServico || [],
            };
            await new AgendamentoCreate().execute(idEmpresa, cleanedData);

            toast.success("Agendamento salvo com sucesso!");
            onSuccess?.();
        } catch (err: any) {
            console.error("Erro ao salvar agendamento:", err);
            toast.error(err || "Erro ao salvar agendamento. Tente novamente.");
        }
    };

    return (
        <>
            <Typography variant="h5" mb={3} textAlign="center">
                Novo Agendamento
            </Typography>

            <form
                onSubmit={handleSubmit(
                    onSubmit,
                    (errors) => {
                        console.error("Erros que impediram o submit:", errors);
                        toast.error("Existem erros no formulário. Veja o console para detalhes.");
                    }
                )}
            >
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
                                    ampm={false}
                                    label="Início"
                                    value={field.value ? new Date(field.value) : null}
                                    onChange={(date) => field.onChange(date)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            error={!!errors.dataHoraInicio}
                                            helperText={
                                                errors.dataHoraInicio?.message ||
                                                (errors.dataHoraInicio as any)?._errors?.[0] || ""
                                            }
                                        />
                                    )}
                                />
                            )}
                        />
                    </LocalizationProvider>


                    <TextField
                        label="Observação"
                        {...register("observacao")}
                        multiline
                        rows={3}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />

                    <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
                        <Button variant="outlined" color="inherit" onClick={onCancel}>
                            Cancelar
                        </Button>
                        <Button variant="contained" color="primary" type="submit">
                            Salvar
                        </Button>
                    </Stack>
                </Stack>
            </form>
        </>
    );
}
