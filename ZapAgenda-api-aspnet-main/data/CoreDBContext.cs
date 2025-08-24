using Microsoft.EntityFrameworkCore;
using ZapAgenda_api_aspnet.models;

namespace ZapAgenda_api_aspnet.data
{
    public class CoreDBContext : DbContext
    {
        public CoreDBContext(DbContextOptions dbContextOptions) : base(dbContextOptions)
        { }

        public required DbSet<Empresa> Empresa { get; set; }
        public required DbSet<Usuario> Usuario { get; set; }
        public required DbSet<Cargo> Cargo { get; set; }
        public required DbSet<Servico> Servico { get; set; }
        public required DbSet<Agendamento> Agendamento { get; set; }
        public required DbSet<AgendamentoServico> AgendamentoServico { get; set; }
        public required DbSet<Cliente> Cliente { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            List<Cargo> cargos = [
                new Cargo {
                    IdCargo = models.Enums.CargoUsuario.ADMIN,
                    NomeCargo = "Admin"
                },
                new Cargo {
                    IdCargo = models.Enums.CargoUsuario.USER,
                    NomeCargo = "User"
                },
                new Cargo {
                    IdCargo = models.Enums.CargoUsuario.MAXADMIN,
                    NomeCargo = "MaxAdmin"
                },
            ];

            modelBuilder.Entity<Cargo>().HasData(cargos);
            modelBuilder.Entity<Usuario>()
                .Property(u => u.Status)
                .HasConversion<int>();

            modelBuilder.Entity<AgendamentoServico>()
                .HasKey(asv => new { asv.IdAgendamento, asv.IdServico });

            modelBuilder.Entity<AgendamentoServico>()
                .HasOne(a => a.Agendamento)
                .WithMany(a => a.AgendamentoServico)
                .HasForeignKey(a => a.IdAgendamento);

            modelBuilder.Entity<AgendamentoServico>()
                .HasOne(a => a.Servico)
                .WithMany(a => a.AgendamentoServico)
                .HasForeignKey(a => a.IdServico);
        }
    }
}