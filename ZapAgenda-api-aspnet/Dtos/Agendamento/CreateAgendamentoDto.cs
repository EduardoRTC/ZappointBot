using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZapAgenda_api_aspnet.Dtos.Agendamento
{
    public class CreateAgendamentoDto
    {
        public DateTime DataHoraInicio { get; set; }
        [MaxLength(500, ErrorMessage = "Observação não pode ser maior que 500 caracteres")]
        [Column(TypeName = "varchar(500)")]
        public string? Observacao { get; set; }
        public required List<int> IdServico { get; set; }
        public int IdCliente { get; set; }
        public int IdUsuario { get; set; }
    }
}