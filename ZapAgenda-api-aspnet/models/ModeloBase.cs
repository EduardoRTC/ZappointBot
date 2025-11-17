using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Newtonsoft.Json;

namespace ZapAgenda_api_aspnet.models
{
    public class ModeloBase
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [JsonPropertyOrder(-99999)]
        public int Id { get; set; }

        [Required]
        [JsonPropertyOrder(99990)]
        public Guid IdEmpresa { get; set; }
        [Required]
        [JsonPropertyOrder(99991)]
        public bool Status { get; set; } = true;
        [Required]
        [JsonPropertyOrder(99992)]
        public DateTime DataCadastro { get; set; } = DateTime.UtcNow;
        [Required]
        [JsonPropertyOrder(99993)]
        public DateTime UltimaModificacao { get; set; } 
        [Required]
        [JsonPropertyOrder(99994)]
        public int ModificadoPor { get; set; }
        [Required] 
        [JsonPropertyOrder(99995)]
        public DateTime DataDesativado {get;set;}
        [Required]
        [JsonPropertyOrder(99996)]
        public int DesativadoPor {get; set;}
        

    }
}