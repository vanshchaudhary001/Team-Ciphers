import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Briefcase,
  Crown,
  ArrowRight,
  ArrowLeft,
  Search,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronRight,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  Network,
  Cpu,
  BarChart3,
  Palette,
  Code2,
  Coins,
  Compass,
  GraduationCap,
  Scale,
  Megaphone,
  Truck,
  KanbanSquare,
  FlaskConical,
  BadgeDollarSign,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { OrgDepartment, OrgBranchNode, OrgSubBranchNode, OrgTeamNode, OrgPositionNode } from '../types/index.js';

interface CompanyOption {
  key: string;
  name: string;
  domain: string;
  category: string;
  location: string;
  badge: string;
  logoBg: string;
  logoColor: string;
}

const COMPANIES: CompanyOption[] = [
  {
    key: 'microsoft',
    name: 'Microsoft Corporation',
    domain: 'microsoft.com',
    category: 'Cloud & AI',
    location: 'Bengaluru / Redmond',
    badge: 'Enterprise Partner',
    logoBg: 'bg-sky-50 border-sky-200',
    logoColor: 'text-sky-600',
  },
  {
    key: 'technova',
    name: 'TechNova Solutions',
    domain: 'technova.demo',
    category: 'Enterprise ERP',
    location: 'Bengaluru HQ',
    badge: 'Primary Demo Tenant',
    logoBg: 'bg-indigo-50 border-indigo-200',
    logoColor: 'text-indigo-600',
  },
  {
    key: 'google',
    name: 'Google LLC',
    domain: 'google.com',
    category: 'Cloud & AI',
    location: 'Hyderabad / Mountain View',
    badge: 'Global Cloud',
    logoBg: 'bg-rose-50 border-rose-200',
    logoColor: 'text-rose-600',
  },
  {
    key: 'amazon',
    name: 'Amazon Web Services',
    domain: 'amazon.com',
    category: 'Cloud & Retail',
    location: 'Hyderabad / Seattle',
    badge: 'Cloud Infrastructure',
    logoBg: 'bg-amber-50 border-amber-200',
    logoColor: 'text-amber-600',
  },
  {
    key: 'apple',
    name: 'Apple Inc.',
    domain: 'apple.com',
    category: 'Hardware & OS',
    location: 'Bengaluru / Cupertino',
    badge: 'Consumer Tech',
    logoBg: 'bg-slate-100 border-slate-200',
    logoColor: 'text-slate-800',
  },
  {
    key: 'nvidia',
    name: 'NVIDIA Corporation',
    domain: 'nvidia.com',
    category: 'AI & Semiconductor',
    location: 'Pune / Santa Clara',
    badge: 'Accelerated Computing',
    logoBg: 'bg-emerald-50 border-emerald-200',
    logoColor: 'text-emerald-600',
  },
  {
    key: 'stripe',
    name: 'Stripe Payments',
    domain: 'stripe.com',
    category: 'FinTech',
    location: 'Bengaluru / San Francisco',
    badge: 'Global Fintech',
    logoBg: 'bg-purple-50 border-purple-200',
    logoColor: 'text-purple-600',
  },
  {
    key: 'salesforce',
    name: 'Salesforce',
    domain: 'salesforce.com',
    category: 'CRM & Cloud',
    location: 'Hyderabad / San Francisco',
    badge: 'Enterprise CRM',
    logoBg: 'bg-cyan-50 border-cyan-200',
    logoColor: 'text-cyan-600',
  },
  {
    key: 'finwise',
    name: 'Finwise Capital',
    domain: 'finwise.demo',
    category: 'FinTech & Banking',
    location: 'Mumbai HQ',
    badge: 'Financial Services',
    logoBg: 'bg-yellow-50 border-yellow-200',
    logoColor: 'text-yellow-600',
  },
  {
    key: 'medcore',
    name: 'MedCore Health Systems',
    domain: 'medcore-systems.com',
    category: 'Healthcare AI',
    location: 'Boston / Delhi',
    badge: 'Health AI',
    logoBg: 'bg-teal-50 border-teal-200',
    logoColor: 'text-teal-600',
  },
];

const DEPT_ICONS: Record<string, React.ElementType> = {
  ADMINISTRATION: Briefcase,
  ANALYTICS: BarChart3,
  'CONSULTING AND CUSTOMER SUPPORT': Users,
  'CORPORATE AND SHARED SERVICES': Layers,
  'DESIGN AND CREATIVE': Palette,
  'ENGINEERING, DEVELOPMENT AND SERVICES': Code2,
  FINANCE: Coins,
  'GENERAL MANAGEMENT': Compass,
  'HARDWARE AND MANUFACTURING': Cpu,
  'HUMAN RESOURCES': Users,
  LEARNING: GraduationCap,
  'LEGAL AND CORPORATE AFFAIRS': Scale,
  MARKETING: Megaphone,
  'OPERATIONS AND SUPPLY CHAIN': Truck,
  'PRODUCT AND PROGRAM MANAGEMENT': KanbanSquare,
  'RESEARCH, APPLIED AND DATA SCIENCES': FlaskConical,
  SALES: BadgeDollarSign,
  'SECURITY ENGINEERING': ShieldCheck,
};

export const RoleGatewayPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, switchDemoUser } = useAuth();

  // Wizard state: 1: Company -> 2: Department -> 3: Sub-Department (Branch/Team) -> 4: Role Level & Position -> 5: Sign In
  const initialCompanyKey = searchParams.get('company') || 'technova';
  const initialCompany = COMPANIES.find((c) => c.key === initialCompanyKey) || COMPANIES[1];

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption>(initialCompany);
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [isLoadingOrg, setIsLoadingOrg] = useState<boolean>(true);

  // Selections
  const [selectedDept, setSelectedDept] = useState<OrgDepartment | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<OrgBranchNode | null>(null);
  const [selectedSubBranch, setSelectedSubBranch] = useState<OrgSubBranchNode | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<OrgTeamNode | null>(null);
  const [selectedRoleLevel, setSelectedRoleLevel] = useState<'Associate' | 'Lead' | 'Manager' | 'CEO'>('Associate');
  const [matchedPosition, setMatchedPosition] = useState<OrgPositionNode | null>(null);

  // Search queries
  const [companySearch, setCompanySearch] = useState<string>('');
  const [companyCategory, setCompanyCategory] = useState<string>('all');
  const [deptSearch, setDeptSearch] = useState<string>('');
  const [subDeptSearch, setSubDeptSearch] = useState<string>('');

  // Login form state
  const [email, setEmail] = useState<string>('associate@technova.demo');
  const [password, setPassword] = useState<string>('demo1234');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Load authoritative hierarchy JSON
  useEffect(() => {
    async function loadOrgData() {
      try {
        setIsLoadingOrg(true);
        const res = await fetch('/org_structure.json');
        if (res.ok) {
          const data = await res.json();
          if (data.departments && data.departments.length > 0) {
            setDepartments(data.departments);
          }
        }
      } catch (err) {
        console.error('Failed to load authoritative org structure:', err);
      } finally {
        setIsLoadingOrg(false);
      }
    }
    loadOrgData();
  }, []);

  // Sync matched position whenever selections change
  useEffect(() => {
    if (!selectedDept) {
      setMatchedPosition(null);
      return;
    }

    if (selectedRoleLevel === 'CEO') {
      // Find CEO position in GENERAL MANAGEMENT
      for (const d of departments) {
        if (d.name === 'GENERAL MANAGEMENT' && d.branches) {
          for (const b of d.branches) {
            for (const sb of b.subBranches) {
              for (const t of sb.teams) {
                const ceoPos = t.positions.find((p) => p.isCeo || p.title.toLowerCase().includes('chief executive'));
                if (ceoPos) {
                  setMatchedPosition(ceoPos);
                  return;
                }
              }
            }
          }
        }
      }
    }

    if (selectedTeam && selectedTeam.positions) {
      const pos = selectedTeam.positions.find((p) => p.roleLevel === selectedRoleLevel);
      if (pos) {
        setMatchedPosition(pos);
        return;
      }
    }

    // Fallback: search in selectedBranch or selectedDept
    if (selectedBranch) {
      for (const sb of selectedBranch.subBranches) {
        for (const t of sb.teams) {
          const pos = t.positions.find((p) => p.roleLevel === selectedRoleLevel);
          if (pos) {
            setMatchedPosition(pos);
            return;
          }
        }
      }
    }

    if (selectedDept && selectedDept.branches) {
      for (const b of selectedDept.branches) {
        for (const sb of b.subBranches) {
          for (const t of sb.teams) {
            const pos = t.positions.find((p) => p.roleLevel === selectedRoleLevel);
            if (pos) {
              setMatchedPosition(pos);
              return;
            }
          }
        }
      }
    }
  }, [selectedDept, selectedBranch, selectedTeam, selectedRoleLevel, departments]);

  // Update demo credentials when role or company changes
  useEffect(() => {
    if (selectedRoleLevel === 'CEO') {
      setEmail('ceo@technova.demo');
    } else if (selectedRoleLevel === 'Manager') {
      setEmail('manager@technova.demo');
    } else if (selectedRoleLevel === 'Lead') {
      setEmail('lead@technova.demo');
    } else {
      setEmail('associate@technova.demo');
    }
  }, [selectedRoleLevel, selectedCompany]);

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return COMPANIES.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
        c.domain.toLowerCase().includes(companySearch.toLowerCase()) ||
        c.category.toLowerCase().includes(companySearch.toLowerCase());
      const matchCategory = companyCategory === 'all' || c.category.includes(companyCategory);
      return matchSearch && matchCategory;
    });
  }, [companySearch, companyCategory]);

  // Filtered departments
  const filteredDepts = useMemo(() => {
    return departments.filter((d) => {
      return (
        d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
        d.code.toLowerCase().includes(deptSearch.toLowerCase()) ||
        String(d.deptNumber).includes(deptSearch)
      );
    });
  }, [departments, deptSearch]);

  // Filtered branches / teams for the selected department
  const filteredBranches = useMemo(() => {
    if (!selectedDept || !selectedDept.branches) return [];
    if (!subDeptSearch.trim()) return selectedDept.branches;
    const q = subDeptSearch.toLowerCase();
    return selectedDept.branches.filter((b) => {
      const matchBranch = b.name.toLowerCase().includes(q);
      const matchSub = b.subBranches.some(
        (sb) => sb.name.toLowerCase().includes(q) || sb.teams.some((t) => t.name.toLowerCase().includes(q))
      );
      return matchBranch || matchSub;
    });
  }, [selectedDept, subDeptSearch]);

  // Handle Login submission
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await login(email, password);
      // Determine destination based on selected role level
      if (selectedRoleLevel === 'CEO') navigate('/dashboard/ceo');
      else if (selectedRoleLevel === 'Manager') navigate('/dashboard/manager');
      else if (selectedRoleLevel === 'Lead') navigate('/dashboard/lead');
      else navigate('/dashboard/associate');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAutofill = async (roleType: 'Associate' | 'Lead' | 'Manager' | 'CEO') => {
    setSelectedRoleLevel(roleType);
    let targetEmail = 'associate@technova.demo';
    if (roleType === 'Lead') targetEmail = 'lead@technova.demo';
    else if (roleType === 'Manager') targetEmail = 'manager@technova.demo';
    else if (roleType === 'CEO') targetEmail = 'ceo@technova.demo';

    setEmail(targetEmail);
    setPassword('demo1234');
    setErrorMsg('');

    try {
      setIsSubmitting(true);
      await switchDemoUser(targetEmail);
      if (roleType === 'CEO') navigate('/dashboard/ceo');
      else if (roleType === 'Manager') navigate('/dashboard/manager');
      else if (roleType === 'Lead') navigate('/dashboard/lead');
      else navigate('/dashboard/associate');
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto w-full">
        {/* Top Header & Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Gateway
          </Link>

          {/* Wizard Step Progress Pills */}
          <div className="flex items-center gap-1 sm:gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-2xs text-xs font-bold">
            <button
              onClick={() => setCurrentStep(1)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                currentStep === 1
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : currentStep > 1
                  ? 'text-indigo-600 hover:bg-indigo-50'
                  : 'text-slate-400'
              }`}
            >
              1. Company
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />

            <button
              onClick={() => selectedCompany && setCurrentStep(2)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                currentStep === 2
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : currentStep > 2
                  ? 'text-indigo-600 hover:bg-indigo-50'
                  : 'text-slate-400'
              }`}
            >
              2. Department
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />

            <button
              onClick={() => selectedDept && setCurrentStep(3)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                currentStep === 3
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : currentStep > 3
                  ? 'text-indigo-600 hover:bg-indigo-50'
                  : 'text-slate-400'
              }`}
            >
              3. Sub-Dept / Team
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />

            <button
              onClick={() => selectedDept && setCurrentStep(4)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                currentStep === 4
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : currentStep > 4
                  ? 'text-indigo-600 hover:bg-indigo-50'
                  : 'text-slate-400'
              }`}
            >
              4. Role Level
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />

            <button
              onClick={() => setCurrentStep(5)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                currentStep === 5 ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-400'
              }`}
            >
              5. Sign In
            </button>
          </div>
        </div>

        {/* ==============================================================
            STEP 1: SELECT ENROLLED COMPANY
            ============================================================== */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Building2 className="w-3 h-3 text-indigo-600" />
                Step 1 of 5: Enterprise Organization
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Select Your Enrolled Organization
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Choose your employer or tenant workspace to load their verified department hierarchy.
              </p>
            </div>

            {/* Search and Category Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search enrolled company (e.g. Microsoft, Google, TechNova)..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['all', 'Cloud', 'Hardware', 'FinTech', 'Enterprise'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCompanyCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      companyCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'All Organizations' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Company Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.map((c) => (
                <div
                  key={c.key}
                  onClick={() => {
                    setSelectedCompany(c);
                    setCurrentStep(2);
                  }}
                  className={`group bg-white p-5 rounded-2xl border ${
                    selectedCompany?.key === c.key ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md' : 'border-slate-200'
                  } hover:border-indigo-500 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl border ${c.logoBg} ${c.logoColor} flex items-center justify-center font-black text-sm shadow-2xs`}>
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {c.category}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-mono">@{c.domain}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{c.location}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-indigo-600">
                    <span>{c.badge}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==============================================================
            STEP 2: SELECT DEPARTMENT (ALL 18 AUTHORITATIVE DEPARTMENTS)
            ============================================================== */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Layers className="w-3 h-3 text-indigo-600" />
                Step 2 of 5: Department ({selectedCompany.name})
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Select Your Department
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Choose from the 18 authoritative departments defined in the organization structure.
              </p>
            </div>

            {/* Department Search */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs max-w-xl mx-auto relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search department (e.g. Security, Sales, Engineering, Finance)..."
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* 18 Departments Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredDepts.map((d) => {
                const IconComponent = DEPT_ICONS[d.name] || Briefcase;
                const branchCount = d.branches?.length || 0;
                let positionCount = 0;
                d.branches?.forEach((b) => b.subBranches?.forEach((sb) => sb.teams?.forEach((t) => (positionCount += t.positions?.length || 0))));

                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      setSelectedDept(d);
                      setSelectedBranch(d.branches?.[0] || null);
                      setSelectedSubBranch(d.branches?.[0]?.subBranches?.[0] || null);
                      setSelectedTeam(d.branches?.[0]?.subBranches?.[0]?.teams?.[0] || null);
                      setCurrentStep(3);
                    }}
                    className={`group bg-white p-4.5 rounded-2xl border ${
                      selectedDept?.id === d.id ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md' : 'border-slate-200'
                    } hover:border-indigo-500 hover:shadow-md transition-all duration-200 cursor-pointer flex items-start justify-between gap-3`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0 shadow-2xs">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono font-bold text-slate-400">
                          {d.code} · DEPT {String(d.deptNumber).padStart(2, '0')}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                          {d.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 font-medium">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {branchCount} Branches
                          </span>
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100 font-semibold">
                            {positionCount} Roles
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white text-slate-400 transition-colors flex items-center justify-center shrink-0">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==============================================================
            STEP 3: SELECT SUB-DEPARTMENT (BRANCH / SUB-BRANCH / TEAM)
            ============================================================== */}
        {currentStep === 3 && selectedDept && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Network className="w-3 h-3 text-indigo-600" />
                Step 3 of 5: Sub-Department ({selectedDept.name})
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Select Your Branch &amp; Team
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Choose your specific sub-department, branch, and team from the authoritative Word document hierarchy.
              </p>
            </div>

            {/* Sub-Department Search */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs max-w-xl mx-auto relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search sub-departments in ${selectedDept.name}...`}
                value={subDeptSearch}
                onChange={(e) => setSubDeptSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Branches & Sub-Branches Accordion / Card View */}
            <div className="space-y-4">
              {filteredBranches.map((branch) => (
                <div key={branch.name} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      <h3 className="text-base font-extrabold text-slate-900">{branch.name}</h3>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {branch.subBranches?.length || 0} Sub-Branches
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {branch.subBranches.map((subBranch) =>
                      subBranch.teams.map((team) => (
                        <div
                          key={`${branch.name}-${subBranch.name}-${team.name}`}
                          onClick={() => {
                            setSelectedBranch(branch);
                            setSelectedSubBranch(subBranch);
                            setSelectedTeam(team);
                            setCurrentStep(4);
                          }}
                          className={`p-3.5 rounded-xl border ${
                            selectedTeam?.name === team.name && selectedBranch?.name === branch.name
                              ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-400'
                          } cursor-pointer transition-all duration-200 flex flex-col justify-between`}
                        >
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
                              {subBranch.name}
                            </div>
                            <div className="text-xs font-bold text-slate-900">{team.name}</div>
                            <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1.5">
                              <span>Positions:</span>
                              <span className="font-semibold text-slate-700">
                                {team.positions.map((p) => p.roleLevel).join(', ')}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-indigo-600">
                            <span>Select Team</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==============================================================
            STEP 4: SELECT ROLE LEVEL & EXACT AUTHORITATIVE POSITION
            ============================================================== */}
        {currentStep === 4 && selectedDept && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Crown className="w-3 h-3 text-indigo-600" />
                Step 4 of 5: Role Level &amp; Position Mapping
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Select Your Role Level
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                The authoritative Word document maps each role level to an exact verified organizational title.
              </p>
            </div>

            {/* Selected Hierarchy Breadcrumbs */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs flex flex-wrap items-center justify-between gap-3 text-indigo-950 font-medium">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-indigo-800">{selectedCompany.name}</span>
                <span>→</span>
                <span className="font-bold text-indigo-800">{selectedDept.name}</span>
                <span>→</span>
                <span className="text-slate-700">{selectedBranch?.name}</span>
                <span>→</span>
                <span className="text-slate-700">{selectedTeam?.name}</span>
              </div>
              <button
                onClick={() => setCurrentStep(3)}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
              >
                Change Sub-Department
              </button>
            </div>

            {/* 4 Role Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  level: 'Associate' as const,
                  title: 'ASSOCIATE',
                  subtitle: 'Entry Level',
                  badge: 'Entry Level',
                  badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                  icon: Users,
                  desc: 'Personal onboarding journey, UNSTICK blocker assistance, day-one checklist & assigned buddy.',
                  demoEmail: 'associate@technova.demo',
                },
                {
                  level: 'Lead' as const,
                  title: 'LEAD',
                  subtitle: 'Mid Level',
                  badge: 'Mid Level',
                  badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
                  icon: Users,
                  desc: 'Team joiner progress oversight, technical mentoring, blocker escalation & sub-branch coordination.',
                  demoEmail: 'lead@technova.demo',
                },
                {
                  level: 'Manager' as const,
                  title: 'MANAGER',
                  subtitle: 'Senior Level',
                  badge: 'Senior Level',
                  badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
                  icon: Briefcase,
                  desc: 'Departmental management, SLA compliance, employee progression, and cross-team resource allocation.',
                  demoEmail: 'manager@technova.demo',
                },
                {
                  level: 'CEO' as const,
                  title: 'CEO',
                  subtitle: 'Executive Access',
                  badge: 'Executive Access',
                  badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
                  icon: Crown,
                  desc: 'Executive governance across all 18 departments, cohort health KPIs, and organizational structure analytics.',
                  demoEmail: 'ceo@technova.demo',
                },
              ].map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRoleLevel === role.level;

                // Find matching position for preview
                let posPreview = '';
                if (role.level === 'CEO') {
                  posPreview = 'Chief Executive Officer';
                } else if (selectedTeam) {
                  const p = selectedTeam.positions.find((item) => item.roleLevel === role.level);
                  posPreview = p?.title || `${role.level} Position`;
                }

                return (
                  <div
                    key={role.level}
                    onClick={() => {
                      setSelectedRoleLevel(role.level);
                    }}
                    className={`group relative bg-white border ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xl'
                        : 'border-slate-200 hover:border-indigo-400'
                    } rounded-3xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between cursor-pointer`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700'
                          } border border-slate-100 shadow-2xs`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${role.badgeColor}`}
                        >
                          {role.badge}
                        </span>
                      </div>

                      <h2 className="text-lg font-black text-slate-900">{role.title}</h2>
                      <div className="text-xs font-semibold text-slate-500 mb-2">{role.subtitle}</div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">{role.desc}</p>

                      {/* Authoritative Position Preview */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Authoritative Title:
                        </div>
                        <div className="text-xs font-black text-indigo-900 leading-tight">
                          {posPreview || `${role.level} in ${selectedDept.name}`}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                      <span className={isSelected ? 'text-indigo-600 font-extrabold' : 'text-slate-600'}>
                        {isSelected ? '✓ Selected' : 'Select'}
                      </span>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Continue to Login Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setCurrentStep(5)}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
              >
                <span>Proceed to Sign In as {selectedRoleLevel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ==============================================================
            STEP 5: SIGN IN & AUTHENTICATION
            ============================================================== */}
        {currentStep === 5 && (
          <div className="max-w-md mx-auto animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Lock className="w-3 h-3 text-indigo-600" />
                  Step 5 of 5: Secure Sign In
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Sign In to Workspace
                </h1>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  {selectedCompany.name} · {selectedDept?.name || 'Department'}
                </p>
              </div>

              {/* Target Position Context Box */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-1.5 text-xs text-indigo-950">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-indigo-700">
                    Selected Position &amp; Role:
                  </span>
                  <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                    {selectedRoleLevel}
                  </span>
                </div>
                <div className="text-sm font-black text-indigo-950">
                  {matchedPosition?.fullTitle || `${selectedRoleLevel} - ${selectedDept?.name}`}
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  Path: {selectedDept?.name} → {selectedBranch?.name || 'General'} → {selectedTeam?.name || 'Team'}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleSubmitLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Corporate Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={`e.g. name@${selectedCompany.domain}`}
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">Password</label>
                    <span className="text-[10px] text-slate-400 font-semibold">Demo: demo1234</span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Authenticate &amp; Access Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick One-Click Demo Personas */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-600 text-center">
                  Instant One-Click Demo Personas:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAutofill('Associate')}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-[11px] font-bold text-slate-700 text-left transition-colors cursor-pointer"
                  >
                    👤 Associate (Entry)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAutofill('Lead')}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-[11px] font-bold text-slate-700 text-left transition-colors cursor-pointer"
                  >
                    👥 Lead (Mid Level)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAutofill('Manager')}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 text-[11px] font-bold text-slate-700 text-left transition-colors cursor-pointer"
                  >
                    💼 Manager (Senior)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAutofill('CEO')}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-[11px] font-bold text-slate-700 text-left transition-colors cursor-pointer"
                  >
                    👑 CEO (Executive)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer info & Register link */}
        <div className="mt-10 text-center text-xs text-slate-500">
          Need to configure a new workspace instead?{' '}
          <a
            href="/register.html"
            className="font-bold text-indigo-600 hover:text-indigo-800 underline ml-1"
          >
            Register a Company
          </a>
        </div>
      </div>
    </div>
  );
};
