namespace ZapAgenda_api_aspnet.Dtos.Cliente
{
    public class ClienteDto
    {
        public string? Nome { get; set; }
        public string Telefone { get; set; } = null!;
        public string Cpf { get; set; } = null!;
        public string? Observacao { get; set; }
        public DateOnly? DataNascimento { get; set; }
    }
}