using System.ComponentModel.DataAnnotations.Schema;

namespace ZapAgenda_api_aspnet.Dtos.Servico
{
    public class CreateServicoDto
    {
        public string Descricao { get; set; } = null!;
        [Column(TypeName = "decimal(18,2)")]
        public decimal Valor { get; set; }
        public TimeSpan TempoDuracao { get; set; }
    }
}