import { Outlet, useParams } from "react-router-dom";
import "./DashboardLayout.css";
import { SideBar } from "../SideBar/SideBar";
import React, { Suspense, useEffect, useState } from "react";
import { Cabecalho as CabecalhoGenerico } from "../Cabecalho/Cabecalho";
import { tipoEmpresa } from "../../enum/TipoEmpresa";
import EmpresaGetById from "../../useCases/empresas/EmpresaGetById";

const CabecalhoClinica = React.lazy(() => import("clinic/Cabecalho"));

export function DashboardLayout() {
  const { idEmpresa } = useParams<{ idEmpresa: string }>();
  const [empresaTipo, setEmpresaTipo] = useState<tipoEmpresa | null>(null);
  const [nome, setNome] = useState<string | null>()

  useEffect(() => {
    const fetchEmpresaTipo = async () => {
      if (!idEmpresa) return;
      try {
        const empresaService = new EmpresaGetById();
        const data = await empresaService.execute(idEmpresa);
        setEmpresaTipo(data.tipoEmpresa ?? tipoEmpresa.GENERICO);
        setNome(data.nomeFantasia)
      } catch (err) {
        console.error("Erro ao carregar empresa:", err);
        setEmpresaTipo(tipoEmpresa.GENERICO);
      }
    };
    fetchEmpresaTipo();
  }, [idEmpresa]);

  return (
    <div className="dashboard-layout">
      <header className="dashboard-layout__header">
        {empresaTipo === null && <p>Carregando cabeçalho...</p>}

        {empresaTipo === tipoEmpresa.CLINICA ? (
          <Suspense fallback={<p>Carregando cabeçalho da clínica...</p>}>
            <CabecalhoClinica nome={nome} />
          </Suspense>
        ) : (
          <CabecalhoGenerico />
        )}
      </header>

      <aside className="dashboard-layout__sidebar">
        <SideBar />
      </aside>

      <main className="dashboard-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
