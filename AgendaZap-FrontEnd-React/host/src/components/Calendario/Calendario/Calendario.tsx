import { useState, useEffect } from "react";
import { Calendar, momentLocalizer, SlotInfo, Formats } from "react-big-calendar";
import moment from "moment";
// @ts-ignore
import "moment/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./Calendario.css";
import AgendamentoModal from "../../Modals/AgendamentoModal";
import AgendamentoPresenter from "../../../presenters/AgendamentoPresenter";
import AgendamentoGetAll from "../../../useCases/agendamento/AgendamentoGetAll";
import { useParams } from "react-router-dom";
import { StatusAgendamento } from "../../../enum/StatusAgendamento";
import CustomToolbar from "../../CustomToolBar/CustomToolbar";
import { tipoEmpresa } from "../../../enum/TipoEmpresa";
import EmpresaGetById from "../../../useCases/empresas/EmpresaGetById";

// 🔹 Locale
moment.locale("pt-br");
moment.updateLocale("pt-br", {
  weekdaysMin: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  months: [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ]
});

const localizer = momentLocalizer(moment);

const messages = {
  allDay: "Dia inteiro",
  previous: "Anterior",
  next: "Próximo",
  today: "Hoje",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "Nenhum evento neste período",
  showMore: (total: number) => `+${total} mais`,
};

const formats: Partial<Formats> = {
  timeGutterFormat: (date, culture, localizer) => localizer.format(date, "HH:mm", culture),
  eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
    `${localizer.format(start, "HH:mm", culture)} — ${localizer.format(end, "HH:mm", culture)}`,
  dayHeaderFormat: (date, culture, localizer) =>
    localizer.format(date, "dddd, DD/MM", culture),
  weekdayFormat: (date) => ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][date.getDay()],
  dayFormat: (date, culture, localizer) => localizer.format(date, "DD", culture),
  monthHeaderFormat: (date, culture, localizer) =>
    localizer.format(date, "MMMM YYYY", culture),
  dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
    `${localizer.format(start, "DD MMM", culture)} – ${localizer.format(end, "DD MMM", culture)}`,
};

export const Calendario = () => {
  const [events, setEvents] = useState<AgendamentoPresenter[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AgendamentoPresenter | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState<string>("");
  const [empresaTipo, setEmpresaTipo] = useState<tipoEmpresa>(tipoEmpresa.GENERICO);

  const { idEmpresa } = useParams<{ idEmpresa: string }>();

  const fetchEmpresaTipo = async () => {
    if (!idEmpresa) return;
    try {
      const empresaService = new EmpresaGetById();
      const data = await empresaService.execute(idEmpresa);
      setEmpresaTipo(data.tipoEmpresa ?? tipoEmpresa.GENERICO);
    } catch (err) {
      console.error("Erro ao carregar empresa:", err);
      setEmpresaTipo(tipoEmpresa.GENERICO);
    }
  };

  const fetchAgendamentos = async () => {
    if (!idEmpresa) return;
    try {
      const agendamentoService = new AgendamentoGetAll();
      const data = await agendamentoService.execute(
        idEmpresa,
        selectedFuncionario || undefined
      );

      const mapped = data.map((item: any) => ({
        ...item,
        start: new Date(item.dataHoraInicio),
        end: new Date(item.dataHoraFim),
        title:
          item.agendamentoServico
            ?.map((s: any) => s.servico.descricao)
            .join(", ") || "Sem título",
      }));

      setEvents(mapped);
    } catch (err) {
      console.error("Erro ao carregar agendamentos:", err);
    }
  };

  useEffect(() => {
    fetchEmpresaTipo();
    fetchAgendamentos();
  }, [idEmpresa, selectedFuncionario]);

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedEvent({
      statusAgendamento: StatusAgendamento.PENDENTE,
      dataHoraInicio: slotInfo.start,
      dataHoraFim: slotInfo.end,
      observacao: "",
      valorTotal: 0,
      idCliente: 0,
      idUsuario: 0,
      idServico: [],
      agendamentoServico: [],
    } as AgendamentoPresenter);
    setModalOpen(true);
  };

  const eventStyleGetter = (event: AgendamentoPresenter) => {
    let backgroundColor = "";
    switch (event.statusAgendamento) {
      case StatusAgendamento.PENDENTE: backgroundColor = "#FFC916"; break;
      case StatusAgendamento.FINALIZADO: backgroundColor = "#7DC588"; break;
      case StatusAgendamento.CANCELADO: backgroundColor = "#FF4500"; break;
      default: backgroundColor = "#808080";
    }

    return {
      style: {
        backgroundColor,
        color: "#000",
        borderRadius: "4px",
        border: "1px solid #ccc",
        padding: "2px",
      },
    };
  };

  return (
    <div className="container calendario" style={{ height: "600px" }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="month"
        views={["month", "week", "day"]}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        culture="pt-BR"
        messages={messages}
        formats={formats}
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: (toolbarProps) => (
            <CustomToolbar
              {...toolbarProps}
              selectedFuncionario={selectedFuncionario}
              onFuncionarioChange={setSelectedFuncionario}
            />
          )
        }}
        style={{ height: "100%" }}
      />

      <AgendamentoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        event={selectedEvent}
        idEmpresa={idEmpresa as string}
        tipo={empresaTipo} // ✅ passa apenas o tipoEmpresa
        onSuccess={fetchAgendamentos}
      />
    </div>
  );
};
