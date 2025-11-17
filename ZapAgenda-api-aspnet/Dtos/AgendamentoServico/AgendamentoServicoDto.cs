using ZapAgenda_api_aspnet.Dtos.Servico;

namespace ZapAgenda_api_aspnet.Dtos.AgendamentoServico
{
    public class AgendamentoServicoDto
    {
        public int IdAgendamento { get; set; }
        public int IdServico { get; set; }
        public ServicoDto Servico { get; set; } = null!;
    }
}