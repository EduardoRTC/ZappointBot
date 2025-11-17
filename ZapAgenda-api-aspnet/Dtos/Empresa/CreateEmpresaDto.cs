using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ZapAgenda_api_aspnet.models.Enums;


namespace ZapAgenda_api_aspnet.Dtos.Empresa
{
    public class CreateEmpresaDto
    {
        [MaxLength(255, ErrorMessage = "Nome Fantasia não pode ser maior que 255 caracteres")]
        [Column(TypeName = "varchar(255)")]
        public required string NomeFantasia { get; set; }
        [MaxLength(14, ErrorMessage = "Cnpj deve receber apenas os números: 14 dígitos")]
        [Column(TypeName = "varchar(14)")]
        public required string Cnpj { get; set; }
        [MaxLength(255, ErrorMessage = "Razão Social não pode ser maior que 255 caracteres")]
        [Column(TypeName = "varchar(255)")]
        public required string RazaoSocial { get; set; }
        public required TipoEmpresa TipoEmpresa { get; set; }
        [MaxLength(255, ErrorMessage = "Email não pode ser maior que 255 caracteres")]
        [Column(TypeName = "varchar(255)")]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        [MaxLength(20, ErrorMessage = "Telefone não pode ser maior que 20 caracteres")]
        [Column(TypeName = "varchar(20)")]
        public string Telefone {get;set;} = string.Empty;
        public required string Cep { get; set; }
        [MaxLength(255,ErrorMessage = "Logradouro não pode ter mais que 255 caracteres")]
        [Column(TypeName = "varchar(255)")]
        public required string Logradouro { get; set; }
        [MaxLength(100,ErrorMessage = "Logradouro não pode ter mais que 100 caracteres")]
        [Column(TypeName = "varchar(100)")]
        public string? Numero { get; set; }
        [MaxLength(255,ErrorMessage = "complemento não pode ter mais que 255 caracteres")]
        [Column(TypeName = "varchar(255)")]
        public string? Complemento { get; set; }
        public string Sigla {get;set;} =  null!;
        public string NomeMunicipio {get;set;} = null!;
    }
}