import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import AgendamentoGetAll from "../../useCases/agendamento/AgendamentoGetAll";
import ClientesGetAll from "../../useCases/clientes/ClientesGetAll";
import UsuarioGetById from "../../useCases/usuario/UsuarioGetById";

// Tipos de relatório
type ReportType =
  | "agendamentosPorDia"
  | "agendamentosPorFuncionario"
  | "novosClientesPorMes";

// Dias da semana
const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

// Paleta de cores
const COLOR_PRIMARY = "#161D30";
const COLOR_SECONDARY = "#21283C";
const COLOR_ACCENT = "#4A90E2";

export default function Relatorios() {
  const [reportType, setReportType] = useState<ReportType>("agendamentosPorDia");
  const [data, setData] = useState<any[]>([]);
  const idEmpresa = "10f3c4e0-ae5a-4550-b39f-33b9f26edc22";

  const agendamentoUseCase = new AgendamentoGetAll();
  const clientesUseCase = new ClientesGetAll();
  const usuarioUseCase = new UsuarioGetById();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (reportType === "novosClientesPorMes") {
          const clientes = await clientesUseCase.execute(idEmpresa);
          const counts: Record<string, number> = {};

          clientes.forEach((c: any) => {
            const mes = new Date(c.dataCadastro).toLocaleString("pt-BR", { month: "long" });
            counts[mes] = (counts[mes] || 0) + 1;
          });

          setData(Object.entries(counts).map(([mes, quantidade]) => ({ mes, quantidade })));
          return;
        }

        const agendamentos = await agendamentoUseCase.execute(idEmpresa);

        if (reportType === "agendamentosPorDia") {
          const counts: Record<string, number> = {};
          diasSemana.forEach(d => counts[d] = 0);

          agendamentos.forEach((a: any) => {
            const dia = new Date(a.dataHoraInicio).getDay();
            const nomeDia = diasSemana[(dia + 6) % 7];
            counts[nomeDia]++;
          });

          setData(diasSemana.map(d => ({ dia: d, quantidade: counts[d] })));
          return;
        }

        if (reportType === "agendamentosPorFuncionario") {
          const counts: Record<number, number> = {};
          agendamentos.forEach((a: any) => {
            counts[a.idUsuario] = (counts[a.idUsuario] || 0) + 1;
          });

          const uniqueUserIds = Object.keys(counts).map(Number);
          const funcionariosData: any[] = [];

          for (const id of uniqueUserIds) {
            try {
              const usuario = await usuarioUseCase.execute(idEmpresa, id);
              funcionariosData.push({
                funcionario: usuario.nomeUsuario || `Usuário ${id}`,
                quantidade: counts[id],
              });
            } catch {
              funcionariosData.push({
                funcionario: `Usuário ${id}`,
                quantidade: counts[id],
              });
            }
          }

          setData(funcionariosData);
        }
      } catch (err) {
        console.error("Erro ao buscar dados do relatório:", err);
        setData([]);
      }
    };

    fetchData();
  }, [reportType]);

  return (
    <Box p={4} sx={{ backgroundColor: COLOR_PRIMARY }}>
      <Typography
        variant="h4"
        mb={3}
        sx={{ color: "#fff", fontWeight: 600 }}
      >
        Relatórios
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <Select
          value={reportType}
          onChange={(e) => setReportType(e.target.value as ReportType)}
          sx={{
            backgroundColor: COLOR_SECONDARY,
            color: "#fff",
            ".MuiSvgIcon-root": { color: "#fff" },
          }}
        >
          <MenuItem value="agendamentosPorDia">Agendamentos por dia da semana</MenuItem>
          <MenuItem value="agendamentosPorFuncionario">Agendamentos por funcionário</MenuItem>
          <MenuItem value="novosClientesPorMes">Novos clientes por mês</MenuItem>
        </Select>
      </FormControl>

      <Card
        sx={{
          backgroundColor: COLOR_SECONDARY,
          color: "#fff",
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}
      >
        <CardContent>
          <Typography variant="h6" mb={2} sx={{ color: "#fff" }}>
            {reportType === "agendamentosPorDia" && "Número de agendamentos por dia"}
            {reportType === "agendamentosPorFuncionario" && "Número de agendamentos por funcionário"}
            {reportType === "novosClientesPorMes" && "Número de novos clientes por mês"}
          </Typography>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey={
                  reportType === "agendamentosPorDia"
                    ? "dia"
                    : reportType === "agendamentosPorFuncionario"
                      ? "funcionario"
                      : "mes"
                }
                tick={{ fill: "#fff" }}
              />
              <YAxis tick={{ fill: "#fff" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: COLOR_SECONDARY,
                  border: "none",
                  color: "#fff",
                }}
              />
              <Bar dataKey="quantidade" fill={COLOR_ACCENT} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
