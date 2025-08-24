using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Newtonsoft.Json;

namespace ZapAgenda_api_aspnet.models
{
    [NotMapped]
    public class Municipio
    {
        [Key]
        [JsonProperty("id")]
        public int IdMunicipio { get; set; }
        [JsonProperty("nome")]
        public string NomeMunicipio { get; set; } = null!;
        public string Sigla { get; set; } = null!;
    }
}