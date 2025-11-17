import { useParams } from "react-router-dom";
import { UseVerificaEmpresa } from "../../hooks/UseVerificaEmpresa";
import "./HomePage.css"
import { Calendario } from "../../components/Calendario/Calendario/Calendario";

export const HomePage = () => {
	const { idEmpresa } = useParams<{ idEmpresa: string }>();

	// if (idEmpresa) {
	// 	UseVerificaEmpresa(idEmpresa);
	// }

	return (
		<div className="home-page-content">
			<div className="home-page__calendario">
				<Calendario />
			</div>
		</div>
	);
};
