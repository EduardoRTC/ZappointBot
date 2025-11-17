import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ToolbarProps } from "react-big-calendar";
import { Select, MenuItem, FormControl, Button, Box } from "@mui/material";
import UsuarioGetAll from "../../useCases/usuario/usuarioGetAll";
import FuncionariosPresenter from "../../presenters/FuncionariosPresenter";

interface CustomToolbarProps extends ToolbarProps {
  selectedFuncionario: string;
  onFuncionarioChange: (id: string) => void;
}

const CustomToolbar = ({ selectedFuncionario, onFuncionarioChange, ...props }: CustomToolbarProps) => {
  const { label, onNavigate, onView } = props;
  const { idEmpresa } = useParams<{ idEmpresa: string }>();
  const [usuarios, setUsuarios] = useState<FuncionariosPresenter[]>([]);

  // Função para buscar usuários
  const fetchUsuarios = async () => {
    if (!idEmpresa) return;
    try {
      const usuarioService = new UsuarioGetAll();
      const data: FuncionariosPresenter[] = await usuarioService.execute(idEmpresa);
      setUsuarios(data);
    } catch (err) {
      console.error("Erro ao carregar funcionários:", err);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [idEmpresa]);

  const getButtonStyles = (view: string) => ({
    backgroundColor: props.view === view ? "#161D30" : "#fff",
    color: props.view === view ? "#fff" : "#000",
    fontFamily: "Poppins, sans-serif",
    textTransform: "none",
    border: "1px solid #000",
    borderRadius: "8px",
    minWidth: 64,
  });

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <Select
          value={selectedFuncionario}
          onChange={(e) => onFuncionarioChange(e.target.value as string)}
          displayEmpty
          variant="outlined"
          sx={{
            backgroundColor: "#fff",
            border: "1px solid #000",
            borderRadius: "8px",
            "& .MuiSelect-select": {
              padding: "10px 12px",
            },
          }}
          renderValue={(selected) => {
            if (!selected) return <em>Todos</em>;
            const usuario = usuarios.find((u) => u.id?.toString() === selected.toString());
            return usuario ? usuario.nomeInteiro || usuario.nomeUsuario : "";
          }}
        >
          <MenuItem value="">
            <em>Todos</em>
          </MenuItem>
          {usuarios.map((u) => (
            <MenuItem key={u.id} value={u.id?.toString()}>
              {u.nomeInteiro || u.nomeUsuario}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <div style={{ fontWeight: "bold", fontSize: 16, fontFamily: "Poppins, sans-serif" }}>
        {label}
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <Button
          onClick={() => onNavigate?.("PREV")}
          sx={{ minWidth: 32, border: "none", color: "#000", fontWeight: "bold", fontFamily: "Poppins, sans-serif" }}
        >
          {"<"}
        </Button>

        <Box display="flex" ml={1} gap={1}>
          <Button onClick={() => onView?.("month")} sx={getButtonStyles("month")}>
            Mês
          </Button>
          <Button onClick={() => onView?.("week")} sx={getButtonStyles("week")}>
            Semana
          </Button>
          <Button onClick={() => onView?.("day")} sx={getButtonStyles("day")}>
            Dia
          </Button>
        </Box>

        <Button
          onClick={() => onNavigate?.("NEXT")}
          sx={{ minWidth: 32, border: "none", color: "#000", fontWeight: "bold", fontFamily: "Poppins, sans-serif", ml: 1 }}
        >
          {">"}
        </Button>
      </div>
    </div>
  );
};

export default CustomToolbar;
