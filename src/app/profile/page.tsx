"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  User,
  Edit,
  Save,
  X,
  ArrowLeft,
  Shield,
  Mail,
  Calendar,
  CreditCard,
  QrCode,
  Users,
  Clock,
  CheckCircle,
  Package,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { profileApi } from "../../services/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import { regiones as regionesData, getComunasByRegion, getRegionByNombre } from "../../data/chile-dpa";
import { formatDni, validateDniWithMessage } from "../../utils/dniValidator";

interface ProfileData {
  id: number;
  email: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname?: string;
  rut: string;
  documentType?: string;
  nombreCompleto: string;
  availablePulseras: number;
  totalPurchasedPulseras: number;
  verified: boolean;
  subscriptionActive: boolean;
  subscriptionExpiresAt: string;
  subscriptionPlanType: string;
  createdAt: string;
  region?: string;
  calle?: string;
  tipoVivienda?: string;
  numero?: string;
  numeroDepto?: string;
  comuna?: string;
  referencia?: string;
  telefono?: string;
}

interface ProfileSummary {
  nombreCompleto: string;
  email: string;
  rut: string;
  cantidadTarjetas: number;
  pulserasDisponibles: number;
  pulserasActivas: number;
  portadoresCreados: number;
  suscripcionActiva: boolean;
  tiempoSuscripcion: number;
}

interface ProfileFormData {
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  rut: string;
}

interface DireccionFormData {
  region: string;
  calle: string;
  tipoVivienda: string;
  numero: string;
  numeroDepto?: string;
  comuna: string;
  referencia?: string;
  telefono: string;
}

interface Region {
  codigo: string;
  nombre: string;
}

interface Comuna {
  codigo: string;
  nombre: string;
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();

  const fromSubscription = searchParams.get('from') === 'subscription';
  const sectionParam = searchParams.get('section');

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingDireccion, setEditingDireccion] = useState(false);
  const [regiones, setRegiones] = useState<Region[]>([])
  const [comunas, setComunas] = useState<Comuna[]>([])
  const [regionSeleccionada, setRegionSeleccionada] = useState<string>('')


  // Cargar regiones desde datos locales
  useEffect(() => {
    setRegiones(regionesData);
  }, []);

  // Cargar comunas cuando cambia la región seleccionada
  useEffect(() => {
    if (!regionSeleccionada) {
      setComunas([]);
      return;
    }

    const comunasDeRegion = getComunasByRegion(regionSeleccionada);
    setComunas(comunasDeRegion);
  }, [regionSeleccionada]);

  // Cargar comunas cuando se abre el formulario de edición con una región existente
  useEffect(() => {
    if (editingDireccion && profile?.region && regiones.length > 0) {
      const regionEncontrada = getRegionByNombre(profile.region);
      if (regionEncontrada && regionSeleccionada !== regionEncontrada.codigo) {
        setRegionSeleccionada(regionEncontrada.codigo);
      }
    }
  }, [editingDireccion, profile?.region, regiones]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>();

  const {
    register: registerDireccion,
    handleSubmit: handleSubmitDireccion,
    reset: resetDireccion,
    formState: { errors: errorsDireccion, isSubmitting: isSubmittingDireccion },
  } = useForm<DireccionFormData>();

  const direccionRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Auto-abrir sección de dirección si viene desde subscription
  useEffect(() => {
    if (sectionParam === 'direccion' && !loading && profile) {
      setEditingDireccion(true);
      // Scroll a la sección de dirección
      setTimeout(() => {
        direccionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [sectionParam, loading, profile]);

  const fetchProfileData = async () => {
    try {
      const [profileResponse, summaryResponse] = await Promise.all([
        profileApi.getProfile(),
        profileApi.getProfileSummary(),
      ]);

      setProfile(profileResponse.data);
      setSummary(summaryResponse.data);

      // Resetear el formulario con los datos actuales
      reset({
        firstName: profileResponse.data.firstName || "",
        paternalSurname: profileResponse.data.paternalSurname || "",
        maternalSurname: profileResponse.data.maternalSurname || "",
        rut: profileResponse.data.rut || "",
      });

      // Resetear el formulario de dirección
      resetDireccion({
        region: profileResponse.data.region || "",
        calle: profileResponse.data.calle || "",
        tipoVivienda: profileResponse.data.tipoVivienda || "",
        numero: profileResponse.data.numero || "",
        numeroDepto: profileResponse.data.numeroDepto || "",
        comuna: profileResponse.data.comuna || "",
        referencia: profileResponse.data.referencia || "",
        telefono: profileResponse.data.telefono || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (data: ProfileFormData) => {
    try {
      const response = await profileApi.updateProfile({
        firstName: data.firstName,
        paternalSurname: data.paternalSurname,
        maternalSurname: data.maternalSurname || undefined,
        // El DNI peruano no tiene dígito verificador, por lo que se permite corregirlo al editar
        ...(profile?.documentType === "DNI" ? { rut: data.rut } : {}),
      });

      setProfile((prev) => (prev ? { ...prev, ...response.data } : null));
      setEditing(false);
      toast.success("Perfil actualizado exitosamente");

      // Refrescar el resumen
      fetchProfileData();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error.response?.data?.error || "Error al actualizar el perfil";
      toast.error(errorMessage);
    }
  };

  const handleUpdateDireccion = async (data: DireccionFormData) => {
    try {
      const response = await profileApi.updateDireccion({
        region: data.region,
        calle: data.calle,
        tipoVivienda: data.tipoVivienda,
        numero: data.numero,
        numeroDepto: data.numeroDepto || undefined,
        comuna: data.comuna,
        referencia: data.referencia || undefined,
        telefono: data.telefono,
      });

      setProfile((prev) => (prev ? { ...prev, ...response.data } : null));
      setEditingDireccion(false);
      toast.success("Dirección actualizada exitosamente");

      // Si viene desde subscription, redirigir de vuelta
      if (fromSubscription) {
        toast.success("Ahora puedes continuar con tu compra");
        setTimeout(() => {
          router.push('/subscription');
        }, 1500);
        return;
      }

      // Refrescar el perfil
      fetchProfileData();
    } catch (error: any) {
      console.error("Error updating address:", error);
      const errorMessage =
        error.response?.data?.error || "Error al actualizar la dirección";
      toast.error(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile || !summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Error al cargar el perfil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al inicio</span>
              </button>

              <div className="flex items-center gap-2">
                <Shield className="w-7 h-7" style={{ color: "#481468" }} />
                <h1 className="text-xl font-semibold text-gray-900">
                  Mi Perfil
                </h1>
              </div>
            </div>

            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90"
                style={{ backgroundColor: "#481468" }}
              >
                <Edit className="w-4 h-4" />
                <span>Editar Perfil</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Banner de retorno a compra */}
      {fromSubscription && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-800">
                Ingresa tu dirección de envío para continuar con tu compra.
              </p>
              <button
                onClick={() => router.push('/subscription')}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors"
                style={{ backgroundColor: '#82c341' }}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Volver a la compra</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {profile.nombreCompleto}
                </h2>
                <p className="text-gray-600">{profile.email}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {profile.verified && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-sm text-gray-500">
                    {profile.verified
                      ? "Cuenta verificada"
                      : "Cuenta no verificada"}
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">
                      Suscripciones activas
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {summary.pulserasActivas}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">
                      Portadores asignados
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      {summary.portadoresCreados}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900">
                      Dispositivos sin asignar
                    </p>
                    <p className="text-lg font-bold text-orange-600">
                      {summary.pulserasDisponibles}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Información Personal
                  </h3>
                  {editing && (
                    <button
                      onClick={() => {
                        setEditing(false);
                        reset();
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {editing ? (
                  <form
                    onSubmit={handleSubmit(handleUpdateProfile)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre *
                        </label>
                        <input
                          {...register("firstName", {
                            required: "El nombre es requerido",
                            minLength: {
                              value: 2,
                              message:
                                "El nombre debe tener al menos 2 caracteres",
                            },
                          })}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black"
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Apellido Paterno *
                        </label>
                        <input
                          {...register("paternalSurname", {
                            required: "El apellido paterno es requerido",
                            minLength: {
                              value: 2,
                              message:
                                "El apellido debe tener al menos 2 caracteres",
                            },
                          })}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black"
                        />
                        {errors.paternalSurname && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.paternalSurname.message}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Apellido Materno
                        </label>
                        <input
                          {...register("maternalSurname")}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black"
                        />
                      </div>

                      {profile.documentType === "DNI" && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            DNI *
                          </label>
                          <input
                            {...register("rut", {
                              required: "El DNI es requerido",
                              validate: (value) => {
                                const validation = validateDniWithMessage(value);
                                return validation.isValid || validation.message;
                              },
                            })}
                            type="text"
                            maxLength={8}
                            placeholder="12345678"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black"
                            onChange={(e) => {
                              const formatted = formatDni(e.target.value);
                              e.target.value = formatted;
                              setValue("rut", formatted);
                              trigger("rut");
                            }}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            El DNI no tiene dígito verificador: puedes corregirlo si fue ingresado con un error.
                          </p>
                          {errors.rut && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.rut.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-white hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: "#481468" }}
                      >
                        <Save className="w-4 h-4" />
                        <span>
                          {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                        </span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Nombre completo</p>
                        <p className="font-medium text-gray-900">
                          {profile.nombreCompleto}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">
                          {profile.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">
                          {profile.documentType === "DNI" ? "DNI" : "RUT"}
                        </p>
                        <p className="font-medium text-gray-900">
                          {profile.rut}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Miembro desde</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(profile.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dirección de Envío */}
            <div ref={direccionRef} className="bg-white rounded-2xl shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Dirección de Envío
                  </h3>
                  {!editingDireccion && (
                    <button
                      onClick={() => setEditingDireccion(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Editar</span>
                    </button>
                  )}
                  {editingDireccion && (
                    <button
                      onClick={() => {
                        setEditingDireccion(false);
                        resetDireccion();
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {editingDireccion ? (
                  <form
                    onSubmit={handleSubmitDireccion(handleUpdateDireccion)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Región *
                        </label>

                        <select
                          {...registerDireccion("region", {
                            required: "La región es requerida",
                            onChange: (e) => {
                              // Buscar el código de la región seleccionada para cargar comunas
                              const regionSeleccionadaObj = getRegionByNombre(e.target.value);
                              if (regionSeleccionadaObj) {
                                setRegionSeleccionada(regionSeleccionadaObj.codigo);
                              } else {
                                setRegionSeleccionada("");
                              }
                            },
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black"
                        >
                          <option value="">Seleccionar...</option>
                          {regiones.map((region) => (
                            <option key={region.codigo} value={region.nombre}>
                              {region.nombre}
                            </option>
                          ))}
                        </select>

                        {errorsDireccion.region && (
                          <p className="text-red-500 text-sm mt-1">
                            {errorsDireccion.region.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Comuna *
                        </label>

                        <select
                          {...registerDireccion("comuna", {
                            required: "La comuna es requerida",
                          })}
                          disabled={!comunas.length}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black disabled:bg-gray-100"
                        >
                          <option value="">Seleccionar...</option>
                          {comunas.map((comuna) => (
                            <option key={comuna.codigo} value={comuna.nombre}>
                              {comuna.nombre}
                            </option>
                          ))}
                        </select>

                        {errorsDireccion.comuna && (
                          <p className="text-red-500 text-sm mt-1">
                            {errorsDireccion.comuna.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Calle *
                        </label>
                        <input
                          {...registerDireccion("calle", {
                            required: "La calle es requerida",
                          })}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black"
                        />
                        {errorsDireccion.calle && (
                          <p className="text-red-500 text-sm mt-1">
                            {errorsDireccion.calle.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número *
                        </label>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <input
                            {...registerDireccion("numero", {
                              required: "El número es requerido",
                            })}
                            type="text"
                            className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black"
                          />
                          <label className="flex items-center gap-2 text-sm text-gray-600 shrink-0">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  registerDireccion("numero").onChange({
                                    target: { value: "S/N", name: "numero" },
                                  });
                                }
                              }}
                            />
                            Sin número
                          </label>
                        </div>
                        {errorsDireccion.numero && (
                          <p className="text-red-500 text-sm mt-1">
                            {errorsDireccion.numero.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Depto/Casa/Oficina/Piso
                        </label>
                        <input
                          {...registerDireccion("numeroDepto")}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Adicional dirección
                        </label>
                        <input
                          {...registerDireccion("tipoVivienda")}
                          type="text"
                          placeholder="Sector Las Animas, Edificio Colon"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teléfono *
                        </label>
                        <input
                          {...registerDireccion("telefono", {
                            required: "El teléfono es requerido",
                            pattern: {
                              value: /^(\+56)?[0-9]{8,9}$/,
                              message: "Formato de teléfono inválido",
                            },
                          })}
                          type="tel"
                          placeholder="+56912345678"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black"
                        />
                        {errorsDireccion.telefono && (
                          <p className="text-red-500 text-sm mt-1">
                            {errorsDireccion.telefono.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Correo electrónico
                        </label>
                        <input
                          type="email"
                          value={profile?.email || ""}
                          disabled
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>

                    </div>

                    <p className="text-sm text-red-600">
                      (*) Campo obligatorio
                    </p>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingDireccion}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-white hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: "#481468" }}
                      >
                        <Save className="w-4 h-4" />
                        <span>
                          {isSubmittingDireccion
                            ? "Guardando..."
                            : "Guardar Dirección"}
                        </span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    {profile.region ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Región</p>
                          <p className="font-medium text-gray-900">
                            {profile.region}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Comuna</p>
                          <p className="font-medium text-gray-900">
                            {profile.comuna}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Dirección</p>
                          <p className="font-medium text-gray-900">
                            {profile.calle} {profile.numero}
                            {profile.numeroDepto &&
                              `, ${profile.tipoVivienda} ${profile.numeroDepto}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Teléfono</p>
                          <p className="font-medium text-gray-900">
                            {profile.telefono}
                          </p>
                        </div>
                        {profile.referencia && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600">Referencia</p>
                            <p className="font-medium text-gray-900">
                              {profile.referencia}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">
                          No has configurado tu dirección de envío
                        </p>
                        <button
                          onClick={() => setEditingDireccion(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90"
                          style={{ backgroundColor: "#481468" }}
                        >
                          <Edit className="w-4 h-4" />
                          <span>Agregar Dirección</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

import { Suspense } from "react";

function ProfilePageInner() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfilePageInner />
    </Suspense>
  );
}
