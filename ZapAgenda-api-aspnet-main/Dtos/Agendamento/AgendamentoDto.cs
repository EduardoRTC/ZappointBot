using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ZapAgenda_api_aspnet.Dtos.Cliente;
using ZapAgenda_api_aspnet.Dtos.Usuario;
using ZapAgenda_api_aspnet.models;

namespace ZapAgenda_api_aspnet.Dtos.Agendamento
{
    public class AgendamentoDto
    {
        public int IdAgendamento { get; set; }
        public string StatusAgendamento { get; set; } = "Pendente";
        public DateTime DataHoraInicio { get; set; }
        public DateTime DataHoraFim { get; set; }
        public string? Observacao { get; set; }
        public TimeSpan TempoDuracaoAgendamento { get; set; }
        public decimal ValorTotal { get; set; }
        public List<AgendamentoServico> AgendamentoServico { get; set; } = [];
        public int IdCliente { get; set; }
        public ClienteDto Cliente { get; set; } = null!;
        public int IdUsuario { get; set; }
        public UsuarioDto Usuario { get; set; } = null!;
    }
}