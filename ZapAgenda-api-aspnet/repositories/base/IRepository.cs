using FluentResults;

namespace ZapAgenda_api_aspnet.repositories.generic
{
    public interface IRepository<T> where T : class
    {
        Task<Result<T>> GetByIdAsync(int id);
        Task<Result<T>> GetByGuidAsync(Guid id);
        Task<List<T>?> GetAllAsync();
        Task<T> CreateAsync(T entity);
        Task<Result<T>> DeleteAsync (int id);
        Task<T?> DeleteAsync (Guid id);
        //Não achei uma maneira boa de fazer um Update Generico todas as formas pareciam má pratica ou apenas abstrai sem necessidade criando mais complexidade
    }
}