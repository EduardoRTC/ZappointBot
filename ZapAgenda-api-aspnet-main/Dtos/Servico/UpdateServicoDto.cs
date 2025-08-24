namespace ZapAgenda_api_aspnet.Dtos.Servico
{
    public class UpdateServicoDto
    {
        public string Descricao { get; set; } = null!;
        public decimal Valor { get; set; }
        public TimeSpan TempoDuracao { get; set; }
    }
}