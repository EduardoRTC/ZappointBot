using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace ZapAgenda_api_aspnet.Dtos.Cliente
{
    public class CreateClienteDto
    {
        public string? Nome { get; set; }
        public string Telefone { get; set; } = null!;
        public string Cpf { get; set; } = null!;
        public string Email { get; set; } = string.Empty;
        public string? Observacao { get; set; }
        public DateOnly? DataNascimento { get; set; }
    }
}