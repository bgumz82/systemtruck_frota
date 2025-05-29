import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  TruckIcon,
  WrenchIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  UserGroupIcon,
  UserIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ReceiptRefundIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'

export default function Sidebar() {
  const location = useLocation()
  const { userType } = useAuth()

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/', icon: HomeIcon },
      { name: 'Relatórios', href: '/relatorios', icon: ChartBarIcon },
    ]

    if (userType === 'admin') {
      return [
        ...baseItems,
        { name: 'Veículos', href: '/veiculos', icon: TruckIcon },
        { name: 'Abastecimentos', href: '/abastecimentos', icon: WrenchIcon },
        { name: 'Manutenções', href: '/manutencoes', icon: WrenchIcon },
        { name: 'Checklists', href: '/checklists', icon: ClipboardDocumentCheckIcon },
        { name: 'Funcionários', href: '/funcionarios', icon: UserIcon },
        { name: 'Usuários', href: '/usuarios', icon: UserGroupIcon },
        { 
          name: 'Financeiro', 
          href: '/financeiro', 
          icon: BanknotesIcon,
          submenu: [
            { name: 'Dashboard', href: '/financeiro/dashboard', icon: ChartBarIcon },
            { name: 'Centros de Custo', href: '/financeiro/centros-custo', icon: CurrencyDollarIcon },
            { name: 'Contas a Pagar', href: '/financeiro/contas-pagar', icon: ReceiptRefundIcon },
            { name: 'Contas a Receber', href: '/financeiro/contas-receber', icon: BanknotesIcon },
            { name: 'Relatórios', href: '/financeiro/relatorios', icon: DocumentChartBarIcon },
          ]
        },
      ]
    }

    if (userType === 'operador_checklist') {
      return [
        ...baseItems,
        { name: 'Checklists', href: '/checklists', icon: ClipboardDocumentCheckIcon },
      ]
    }

    if (userType === 'operador_abastecimento') {
      return [
        ...baseItems,
        { name: 'Abastecimentos', href: '/abastecimentos', icon: WrenchIcon },
      ]
    }

    return baseItems
  }

  const navigation = getNavigationItems()

  return (
    <div className="flex flex-col w-64 bg-gray-800 h-[calc(100vh-4rem)]">
      <nav className="mt-5 flex-1 space-y-1 px-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.submenu && item.submenu.some(subitem => location.pathname === subitem.href))
          
          return (
            <div key={item.name}>
              {item.submenu ? (
                <div>
                  <div
                    className={`${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </div>
                  <div className="ml-8 mt-1 space-y-1">
                    {item.submenu.map((subitem) => {
                      const isSubActive = location.pathname === subitem.href
                      return (
                        <Link
                          key={subitem.name}
                          to={subitem.href}
                          className={`${
                            isSubActive
                              ? 'bg-gray-900 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                        >
                          <subitem.icon
                            className={`${
                              isSubActive ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'
                            } mr-3 flex-shrink-0 h-5 w-5`}
                            aria-hidden="true"
                          />
                          {subitem.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <Link
                  to={item.href}
                  className={`${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'
                    } mr-3 flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}