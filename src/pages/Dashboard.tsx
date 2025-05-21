import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  TruckIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  WrenchScrewdriverIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { getDashboardStats, getProximasManutencoes, getConsumoMensal } from '@/lib/api/dashboard'

export default function Dashboard() {
  const { userType } = useAuth()

  const { data: stats, isLoading: isLoadingStats, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  const { data: proximasManutencoes, isLoading: isLoadingManutencoes, error: manutencoesError } = useQuery({
    queryKey: ['proximas-manutencoes'],
    queryFn: getProximasManutencoes,
    staleTime: 1000 * 60 * 5,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  const { data: consumoMensal, isLoading: isLoadingConsumo, error: consumoError } = useQuery({
    queryKey: ['consumo-mensal'],
    queryFn: getConsumoMensal,
    staleTime: 1000 * 60 * 5,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  const isLoading = isLoadingStats || isLoadingManutencoes || isLoadingConsumo
  const hasError = statsError || manutencoesError || consumoError

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Erro ao carregar dados
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Por favor, tente novamente mais tarde.
          </p>
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  const showEmptyState = !stats?.totalVeiculos

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        {showEmptyState && userType === 'admin' ? (
          <div className="mt-8 text-center">
            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              Nenhum veículo cadastrado
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece cadastrando seu primeiro veículo para visualizar as estatísticas.
            </p>
            <div className="mt-6">
              <Link
                to="/veiculos"
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                Cadastrar Veículo
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card - Total de Veículos */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TruckIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total de Veículos
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats?.totalVeiculos ?? 0}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card - Manutenções Pendentes */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon 
                        className={`h-6 w-6 ${
                          (stats?.manutencoesPendentes ?? 0) > 0 ? 'text-red-400' : 'text-yellow-400'
                        }`} 
                        aria-hidden="true" 
                      />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Manutenções Pendentes
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats?.manutencoesPendentes ?? 0}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card - Checklists Hoje */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClipboardDocumentCheckIcon className="h-6 w-6 text-green-400" aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Checklists Hoje
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats?.checklistsHoje ?? 0}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card - Abastecimentos Hoje */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <WrenchScrewdriverIcon className="h-6 w-6 text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Abastecimentos Hoje
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats?.abastecimentosHoje ?? 0}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Área para gráficos e tabelas */}
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Gráfico de Consumo de Combustível */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900">Consumo de Combustível</h3>
                {(consumoMensal?.length ?? 0) > 0 ? (
                  <div className="mt-4">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mês
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Litros
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Valor Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {consumoMensal?.map((consumo, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {consumo.mes}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {consumo.total_litros.toFixed(2)}L
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(consumo.valor_total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-4 text-center py-12 text-gray-500">
                    <p>Nenhum registro de abastecimento encontrado.</p>
                  </div>
                )}
              </div>

              {/* Lista de Manutenções Próximas */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900">Próximas Manutenções</h3>
                {(proximasManutencoes?.length ?? 0) > 0 ? (
                  <div className="mt-4">
                    <div className="flow-root">
                      <ul role="list" className="-my-5 divide-y divide-gray-200">
                        {proximasManutencoes?.map((manutencao) => (
                          <li key={manutencao.id} className="py-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <WrenchScrewdriverIcon className="h-6 w-6 text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {manutencao.veiculo.placa} - {manutencao.veiculo.modelo}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {manutencao.tipo}
                                </p>
                              </div>
                              <div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  {format(parseISO(manutencao.data_prevista), "dd/MM/yyyy")}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-center py-12 text-gray-500">
                    <p>Nenhuma manutenção agendada.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}