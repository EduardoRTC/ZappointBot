import { Outlet, useParams } from "react-router-dom";
import React, { Suspense, useEffect, useState } from "react";
import { Grid, Box, Toolbar } from "@mui/material";

import { SideBar } from "../SideBar/SideBar";
import { Cabecalho as CabecalhoGenerico } from "../Cabecalho/Cabecalho";
import { tipoEmpresa } from "../../enum/TipoEmpresa";
import EmpresaGetById from "../../useCases/empresas/EmpresaGetById";

const CabecalhoClinica = React.lazy(() => import("clinic/Cabecalho"));

const drawerWidth = 240;

export function DashboardLayout() {
  const { idEmpresa } = useParams<{ idEmpresa: string }>();
  const [empresaTipo, setEmpresaTipo] = useState<tipoEmpresa | null>(null);
  const [nome, setNome] = useState<string | null>();

  useEffect(() => {
    const fetchEmpresaTipo = async () => {
      if (!idEmpresa) return;

      try {
        const empresaService = new EmpresaGetById();
        const data = await empresaService.execute(idEmpresa);

        setEmpresaTipo(data.tipoEmpresa ?? tipoEmpresa.GENERICO);
        setNome(data.nomeFantasia);
      } catch (err) {
        console.error("Erro ao carregar empresa:", err);
        setEmpresaTipo(tipoEmpresa.GENERICO);
      }
    };

    fetchEmpresaTipo();
  }, [idEmpresa]);

  return (
    <Grid container sx={{ height: "100vh", overflow: "hidden" }}>

      {/* SIDEBAR */}
      <Grid
        item
        sx={{
          width: { xs: "0px", md: `${drawerWidth}px` },
          flexShrink: 0,
        }}
      >
        <SideBar />
      </Grid>

      {/* ÁREA PRINCIPAL */}
      <Grid
        item
        xs
        sx={{
          flexGrow: 1,
          overflow: "auto",
          height: "100vh",
        }}
      >
        {/* Cabeçalho */}
        <Box sx={{ position: "sticky", top: 0, zIndex: 1200, bgcolor: "#fff" }}>
          {empresaTipo === null && <p>Carregando cabeçalho...</p>}

          {empresaTipo === tipoEmpresa.CLINICA ? (
            <Suspense fallback={<p>Carregando cabeçalho da clínica...</p>}>
              <CabecalhoClinica nome={nome} />
            </Suspense>
          ) : (
            <CabecalhoGenerico />
          )}
        </Box>

        {/* Para "empurrar" o conteúdo abaixo do cabeçalho */}
        <Toolbar />

        {/* Conteúdo principal das rotas */}
        <Box sx={{ padding: 2 }}>
          <Outlet />
        </Box>
      </Grid>
    </Grid>
  );
}
