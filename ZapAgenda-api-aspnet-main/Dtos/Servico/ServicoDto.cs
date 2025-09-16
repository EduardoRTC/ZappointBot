namespace ZapAgenda_api_aspnet.Dtos.Servico
{
    public class ServicoDto
    {
        public string Descricao { get; set; } = null!;
        public float Valor { get; set; }
        public TimeSpan TempoDuracao { get; set; }
    }
}