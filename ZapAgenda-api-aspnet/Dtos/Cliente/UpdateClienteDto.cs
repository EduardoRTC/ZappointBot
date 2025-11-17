using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace ZapAgenda_api_aspnet.Dtos.Cliente
{
    public class UpdateClienteDto
    {
        public string? Nome { get; set; }
        public string Telefone { get; set; } = null!;
        public string Cpf { get; set; } = null!;
        public string Email { get; set; } = string.Empty;
        public string? Observacao { get; set; }
        public DateOnly? DataNascimento { get; set; }
        public bool Status { get; set; } = true;
    }
}