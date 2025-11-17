using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Newtonsoft.Json;

namespace ZapAgenda_api_aspnet.models
{
    [NotMapped]
    public class Estado
    {
        [Key]
        [JsonProperty("sigla")]
        public required string Sigla { get; set; }
        [JsonProperty("nome")]
        public required string Nome { get; set; }
    }
}