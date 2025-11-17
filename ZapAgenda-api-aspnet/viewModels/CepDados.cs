using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using Newtonsoft.Json;

namespace ZapAgenda_api_aspnet.models
{
    [NotMapped]
    public class CepDados
    {
        [JsonProperty("cep")]
        public required string Cep { get; set; }
        [JsonProperty("logradouro")]
        public required string Logradouro { get; set; }
        [JsonProperty("complemento")]
        public required string Complemento { get; set; }
        [JsonProperty("bairro")]
        public required string Bairro { get; set; }
        [JsonProperty("localidade")]
        public required string CidadeCep { get; set; }
        [JsonProperty("uf")]
        public required string SiglaCep { get; set; }
        [JsonProperty("regiao")]
        public required string Regiao { get; set; }
        [JsonProperty("ibge")]
        public required int IdMunicipioCep { get; set; }
    }
}