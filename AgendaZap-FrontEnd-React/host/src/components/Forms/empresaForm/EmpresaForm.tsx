import { useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Stack,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Card,
  Button,
} from "@mui/material";
import { IMaskInput } from "react-imask";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { tipoEmpresa } from "../../../enum/TipoEmpresa";
import { paths } from "../../../paths";
import { EmpresaPresenter } from "../../../presenters/EmpresaPresenter";
import EmpresaUpdate from "../../../useCases/empresas/EmpresaUpdate";
import { EmpresaSchema, EmpresaSchemaType } from "../../../schema/EmpresaSchema";

export default function EmpresaForm({ empresa }: { empresa?: EmpresaPresenter }) {
  const navigate = useNavigate();
  const { idEmpresa } = useParams<{ idEmpresa: string }>();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmpresaSchemaType>({
    resolver: zodResolver(EmpresaSchema),
    defaultValues: new EmpresaPresenter(),
  });

  // se estiver editando, preenche o form
  useEffect(() => {
    if (empresa) {
      reset(empresa);
    } else {
      reset(new EmpresaPresenter());
    }
  }, [empresa, reset]);

  const onSubmit = async (data: EmpresaSchemaType) => {
    try {
      const cleanedData = {
        ...data,
        cnpj: data.cnpj.replace(/\D/g, ""),
        cep: data.cep.replace(/\D/g, ""),
        telefone: data.telefone.replace(/\D/g, ""),
      };

      if (empresa) {
        const empresaUpdate = new EmpresaUpdate();
        await empresaUpdate.execute(idEmpresa as string, cleanedData);
      }

      toast.success("Empresa salva com sucesso!");
      navigate(paths.home.home(idEmpresa as string));
    } catch (err: any) {
      console.error("Erro ao salvar empresa:", err);
      toast.error("Erro ao salvar empresa. Tente novamente.");
    }
  };

  const onCancel = useCallback(() => {
    navigate(paths.home.home(idEmpresa as string));
  }, [navigate]);

  return (
    <Card sx={{ maxWidth: 700, mx: "auto", p: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" mb={3} textAlign="center">
        {"Editar Empresa"}
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3}>
          <TextField
            label="Nome Fantasia"
            {...register("nomeFantasia")}
            error={!!errors.nomeFantasia}
            helperText={errors.nomeFantasia?.message}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Razão Social"
            {...register("razaoSocial")}
            error={!!errors.razaoSocial}
            helperText={errors.razaoSocial?.message}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <Controller
            name="cnpj"
            control={control}
            render={({ field }) => (
              <TextField
                label="CNPJ"
                {...field}
                InputProps={{
                  inputComponent: IMaskInput as any,
                  inputProps: {
                    mask: "00.000.000/0000-00",
                    value: field.value,
                    onAccept: (v: string) => field.onChange(v),
                  },
                }}
                error={!!errors.cnpj}
                helperText={errors.cnpj?.message}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            )}
          />

          <FormControl fullWidth>
            <InputLabel id="tipoEmpresa-label">Tipo de Empresa</InputLabel>

            <Controller
              name="tipoEmpresa"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  labelId="tipoEmpresa-label"
                  label="Tipo de Empresa"
                  value={field.value ?? tipoEmpresa.GENERICO}
                >
                  {Object.entries(tipoEmpresa)
                    .filter(([_, v]) => typeof v === "number")
                    .map(([key, value]) => (
                      <MenuItem key={value} value={value}>
                        {key}
                      </MenuItem>
                    ))}
                </Select>
              )}
            />
          </FormControl>

          {/* Telefone e Email na mesma linha */}
          <Stack direction="row" spacing={2}>
            <Controller
              name="telefone"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Telefone"
                  {...field}
                  InputProps={{
                    inputComponent: IMaskInput as any,
                    inputProps: {
                      mask: "(00) 00000-0000",
                      value: field.value,
                      onAccept: (v: string) => field.onChange(v),
                    },
                  }}
                  error={!!errors.telefone}
                  helperText={errors.telefone?.message}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />

            <TextField
              label="Email"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>


          <Stack direction="row" spacing={2}>
            <Controller
              name="cep"
              control={control}
              render={({ field }) => (
                <TextField
                  label="CEP"
                  {...field}
                  InputProps={{
                    inputComponent: IMaskInput as any,
                    inputProps: {
                      mask: "00000-000",
                      value: field.value,
                      onAccept: (v: string) => field.onChange(v),
                    },
                  }}
                  error={!!errors.cep}
                  helperText={errors.cep?.message}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
            <TextField
              label="Logradouro"
              {...register("logradouro")}
              error={!!errors.logradouro}
              helperText={errors.logradouro?.message}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Número"
              {...register("numero")}
              error={!!errors.numero}
              helperText={errors.numero?.message}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Complemento"
              {...register("complemento")}
              error={!!errors.complemento}
              helperText={errors.complemento?.message}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Sigla"
              {...register("sigla")}
              error={!!errors.sigla}
              helperText={errors.sigla?.message}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Município"
              {...register("nomeMunicipio")}
              error={!!errors.nomeMunicipio}
              helperText={errors.nomeMunicipio?.message}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
            <Button variant="contained" sx={{ backgroundColor: "#0F1938" }} type="submit">
              Salvar
            </Button>
            <Button variant="outlined" color="inherit" onClick={onCancel}>
              Cancelar
            </Button>
          </Stack>
        </Stack>
      </form>
    </Card>
  );
}
