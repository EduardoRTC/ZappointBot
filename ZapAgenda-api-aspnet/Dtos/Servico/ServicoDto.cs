namespace ZapAgenda_api_aspnet.Dtos.Servico
{
    public class ServicoDto
    {
        public int Id { get; set; }
        public Guid IdEmpresa { get; set; }
        public string Descricao { get; set; } = null!;
        public decimal Valor { get; set; }
        public TimeSpan TempoDuracao { get; set; }
    }
}