namespace ZapAgenda_api_aspnet.Dtos.Agendamento
{
    public class UpdateAgendamentoDto
    {
        public DateTime DataHoraInicio { get; set; }
        public DateTime DataHoraFim {get;set;}
        public string? Observacao { get; set; }
        public List<int> IdServico { get; set; } = [];
        public int IdCliente { get; set; }
        public int IdUsuario { get; set; }
        public decimal ValorTotal { get; set; }
        public string StatusAgendamento { get; set; } = null!;
    }
}