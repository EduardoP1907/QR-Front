"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Plus,
  QrCode,
  Edit,
  Trash2,
  Download,
  Shield,
  LogOut,
  User,
  Heart,
  Phone,
  AlertTriangle,
  X,
  ShoppingCart,
  UserPlus,
  TrendingUp,
  Package,
  CheckCircle,
  Clock,
  Activity,
  Users,
  Calendar,
  CreditCard,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { pulseraApi, contratanteApi, medicalDataApi } from "../../services/api";
import type {
  Enfermedad,
  PrincipioActivo,
  AssignPulseraFormData,
} from "../../types";
import ProtectedRoute from "../../components/ProtectedRoute";
import {
  formatRutSimple,
  validateRutWithMessage,
  cleanRut,
} from "../../utils/rutValidator";

interface PulseraFormData {
  // Datos de la pulsera
  name: string;
  description: string;

  // Datos del portador
  portadorEmail: string;
  portadorRut: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;

  // Información médica y contacto
  tipoSangre: string;
  contactoEmergencia: string;
  telefonoEmergencia: string;
  condicionesMedicas: string;
  medicamentos: string;
  alergias: string;
}

interface Pulsera {
  id: string;
  name: string;
  customId?: string;
  description?: string;
  qrCode?: string;
  medicalInfo?: string;
  active?: boolean;
  status?: string;
  owner?: any;
  portador?: any;
}

interface AssignFormData {
  // Identificación
  portadorEmail: string;
  portadorRut: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname?: string;

  // Datos físicos
  fechaNacimiento?: string;
  grupoSanguineo?: string;
  peso?: number;
  estatura?: number;

  // Información médica básica
  medicalInfo?: string;
  condicionesMedicas?: string;
  medicamentos?: string;
  alergias?: string;
}

interface PortadorModalProps {
  open: boolean;
  onClose: () => void;
  mode: PortadorMode;
  initialData?: Portador;
}
type PortadorMode = "add" | "edit";
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();

  // Verificar rol del usuario
  useEffect(() => {
    if (user && user.role !== "contratante") {
      toast.error("Acceso denegado. Esta página es solo para contratantes.");

      // Redirigir según el rol
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (user.role === "portador") {
        router.push("/portador/dashboard");
      } else {
        logout();
        router.push("/login");
      }
    }
  }, [user, router, logout]);
  const [portadorMode, setPortadorMode] = useState<PortadorMode>("add");
  const [pulseras, setPulseras] = useState<Pulsera[]>([]);
  const [loading, setLoading] = useState(true);
  const [availablePulseras, setAvailablePulseras] = useState(0);
  const [claimingQr, setClaimingQr] = useState(false);
  const claimedQrsRef = useRef<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPulsera, setEditingPulsera] = useState<Pulsera | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningPulsera, setAssigningPulsera] = useState<Pulsera | null>(
    null,
  );
  const [portadores, setPortadores] = useState<any[]>([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [selectedPortadorId, setSelectedPortadorId] = useState<string>("");
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [claimedPulseraForAssignment, setClaimedPulseraForAssignment] =
    useState<Pulsera | null>(null);
  const [showExpandedQrModal, setShowExpandedQrModal] = useState(false);
  const [expandedQrImage, setExpandedQrImage] = useState("");
  const [expandedQrUserName, setExpandedQrUserName] = useState("");

  // Medical data for dropdowns
  const [enfermedades, setEnfermedades] = useState<Enfermedad[]>([]);
  const [principiosActivos, setPrincipiosActivos] = useState<PrincipioActivo[]>(
    [],
  );

  // New structure for pathologies (enfermedades)
  const [patologiasDetalle, setPatologiasDetalle] = useState<
    Array<{
      enfermedadId: number;
      nombreCustom?: string;
    }>
  >([]);

  // New structure for active principles with concentration and dosage
  const [principiosActivosDetalle, setPrincipiosActivosDetalle] = useState<
    Array<{
      principioActivoId: number;
      concentracion: string;
      dosis: string;
      observaciones?: string;
      searchTerm?: string;
      nombreCustom?: string;
    }>
  >([]);

  // Search states for each row (active principles)
  const [searchStates, setSearchStates] = useState<Record<number, string>>({});
  // Focus states for each row (active principles)
  const [focusStates, setFocusStates] = useState<Record<number, boolean>>({});

  // Search and focus states for pathologies
  const [searchStatesPatologias, setSearchStatesPatologias] = useState<
    Record<number, string>
  >({});
  const [focusStatesPatologias, setFocusStatesPatologias] = useState<
    Record<number, boolean>
  >({});

  // Emergency contacts data
  const [contactosEmergenciaDetalle, setContactosEmergenciaDetalle] = useState<
    Array<{
      nombre: string;
      telefono: string;
    }>
  >([]);

  // Forms
  const createForm = useForm<PulseraFormData>();
  const editForm = useForm<PulseraFormData>();
  const assignForm = useForm<AssignFormData>();

  // Cargar pulseras, pulseras disponibles y portadores
  useEffect(() => {
    // Solo cargar datos si el usuario es contratante
    if (!user || user.role !== "contratante") {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [pulserasResponse, portadoresResponse] =
          await Promise.all([
            pulseraApi.getAll(),
            contratanteApi.getPortadores(),
          ]);

        const pulserasList = Array.isArray(pulserasResponse.data)
          ? pulserasResponse.data
          : (pulserasResponse.data?.items ?? []);

        setPulseras(pulserasList);
        setPortadores(
          Array.isArray(portadoresResponse.data)
            ? portadoresResponse.data
            : (portadoresResponse.data?.items ?? []),
        );

        // getAvailablePulseras puede fallar para contratantes sin compras (cortesía)
        try {
          const availableResponse = await contratanteApi.getAvailablePulseras();
          setAvailablePulseras(availableResponse.data.availablePulseras || 0);
        } catch (_e) {
          setAvailablePulseras(0);
        }

        console.log("📋 [fetchData] Pulseras cargadas:", pulserasList.length, pulserasList.map((p: any) => ({ id: p.id, customId: p.customId, portador: !!p.portador, assigned: p.assigned, status: p.status })));

        // Recuperar automáticamente pulseras reclamadas sin portador asignado.
        const pulseraClaimedPendiente = pulserasList.find(
          (p: any) => !p.portador && !p.assigned
        );
        console.log("🔍 [fetchData] Pulsera pendiente de asignar:", pulseraClaimedPendiente ? `${pulseraClaimedPendiente.customId} (id:${pulseraClaimedPendiente.id})` : "NINGUNA");
        if (pulseraClaimedPendiente) {
          setClaimedPulseraForAssignment(pulseraClaimedPendiente);
          toast('Tienes un Bluko Life pendiente de asignar a un portador.', {
            icon: '🔗',
            duration: 6000,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("No se pudieron cargar los datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Load medical data for dropdowns
  useEffect(() => {
    const loadMedicalData = async () => {
      try {
        const [enfermedadesResponse, principiosResponse] = await Promise.all([
          medicalDataApi.getEnfermedades(),
          medicalDataApi.getPrincipiosActivos(),
        ]);

        setEnfermedades(enfermedadesResponse.data || []);
        setPrincipiosActivos(principiosResponse.data || []);
      } catch (error) {
        console.error("Error loading medical data:", error);
        toast.error("Error al cargar datos médicos");
      }
    };

    loadMedicalData();
  }, []);

  // Handle QR claim from scan page
  useEffect(() => {
    // Solo permitir claim si el usuario es contratante
    if (!user || user.role !== "contratante") {
      return;
    }

    const initializeQrClaim = async () => {
      let claimQr = searchParams.get("claimQr");
      console.log("🔍 [claim] URL claimQr param:", claimQr);

      // Check localStorage for pending QR claim after login
      if (!claimQr && typeof window !== "undefined") {
        const pendingQr = localStorage.getItem("pendingClaimQr");
        console.log("🔍 [claim] localStorage pendingClaimQr:", pendingQr);
        if (pendingQr) {
          claimQr = pendingQr;
          localStorage.removeItem("pendingClaimQr");

          try {
            await contratanteApi.saveScannedQr(pendingQr);
          } catch (error) {
            console.error("Error saving QR to backend:", error);
          }

          router.replace(`/dashboard?claimQr=${pendingQr}`);
        }
      }

      // Si no hay QR en URL ni en localStorage, intentar obtener del backend
      if (!claimQr) {
        try {
          const response = await contratanteApi.getScannedQr();
          if (response.data?.qrCode) {
            claimQr = response.data.qrCode;
            router.replace(`/dashboard?claimQr=${claimQr}`);
          }
        } catch (error: any) {
          if (error.response?.status !== 404) {
            console.error("Error getting scanned QR from backend:", error);
          }
        }
      }

      console.log("🔍 [claim] Final claimQr resolved:", claimQr || "NONE");
      return claimQr;
    };

    // Execute async initialization
    const handleClaimInit = async () => {
      const claimQr = await initializeQrClaim();

      // Prevent claiming the same QR multiple times
      if (claimQr && !claimingQr && !claimedQrsRef.current.has(claimQr)) {
        // Mark this QR as being claimed
        claimedQrsRef.current.add(claimQr);

        const handleClaimQr = async () => {
          setClaimingQr(true);
          console.log("🚀 [claim] Intentando reclamar QR:", claimQr);

          try {
            const response = await contratanteApi.claimQr(claimQr);
            console.log("✅ [claim] Claim exitoso, respuesta:", response.data);

            toast.success(
              "¡QR reclamado exitosamente! Ahora puedes asignar el Bluko Life a un portador.",
            );

            // Recargar pulseras (crítico para mostrar botón de asignación)
            let updatedPulserasList: any[] = [];
            try {
              const pulserasResponse = await pulseraApi.getAll();
              updatedPulserasList = Array.isArray(pulserasResponse.data)
                ? pulserasResponse.data
                : (pulserasResponse.data?.items ?? []);
              setPulseras(updatedPulserasList);
            } catch (err) {
              console.error("Error recargando pulseras post-claim:", err);
            }

            // Recargar contador de pulseras disponibles (no crítico)
            try {
              const availableResponse = await contratanteApi.getAvailablePulseras();
              setAvailablePulseras(availableResponse.data.availablePulseras || 0);
            } catch (_err) {
              setAvailablePulseras(0);
            }

            // Buscar la pulsera recién reclamada para mostrar botón de asignación
            const pulseraId =
              response.data.pulseraId || response.data.pulsera?.id;
            let claimedPulsera = pulseraId
              ? updatedPulserasList.find((p: any) => String(p.id) === String(pulseraId))
              : updatedPulserasList.find((p: any) => !p.portador && !p.assigned);

            // Fallback: si no encontramos en la lista, usamos los datos de la respuesta del claim
            if (!claimedPulsera && pulseraId) {
              claimedPulsera = {
                id: pulseraId,
                customId: response.data.customId || '',
                status: 'CLAIMED',
                portador: null,
              };
            }

            console.log("🔍 [claim] pulseraId:", pulseraId, "| claimedPulsera:", claimedPulsera);
            if (claimedPulsera) {
              console.log("✅ [claim] setClaimedPulseraForAssignment:", claimedPulsera.id, claimedPulsera.customId);
              setClaimedPulseraForAssignment(claimedPulsera);
            } else {
              console.warn("⚠️ [claim] claimedPulsera es null — el botón verde NO aparecerá");
            }
          } catch (error: any) {
            console.error("Error claiming QR:", error);
            const errorMsg =
              error.response?.data?.error ||
              error.response?.data?.message ||
              "Error al reclamar el QR";

            // Si ya fue reclamada, buscar la pulsera en la lista y mostrar opción de asignar
            if (
              errorMsg.toLowerCase().includes("ya ha sido reclamada") ||
              errorMsg.toLowerCase().includes("already claimed") ||
              error.response?.status === 400
            ) {
              try {
                const pulserasResponse = await pulseraApi.getAll();
                const lista = Array.isArray(pulserasResponse.data)
                  ? pulserasResponse.data
                  : (pulserasResponse.data?.items ?? []);
                setPulseras(lista);
                const pendiente = lista.find((p: any) => !p.portador && !p.assigned);
                if (pendiente) {
                  setClaimedPulseraForAssignment(pendiente);
                  toast('Bluko Life reclamado — selecciona un portador para asignarlo.', { icon: '🔗', duration: 6000 });
                } else {
                  toast.error("Este Bluko Life ya fue reclamado y asignado.");
                }
              } catch {
                toast.error("Este Bluko Life ya fue reclamado. Recarga la página.");
              }
            } else {
              toast.error(errorMsg);
            }

            // Remove from ref on error so it can be retried if needed
            claimedQrsRef.current.delete(claimQr);

            // ALWAYS remove claimQr from URL to prevent infinite loop
            router.replace("/dashboard");
          } finally {
            setClaimingQr(false);
          }
        };

        handleClaimQr();
      }
    };

    handleClaimInit();
  }, [searchParams, claimingQr, router, assignForm, user]);

  // Cargar QR codes para todas las pulseras (incluyendo las asignadas a portadores)
  useEffect(() => {
    const loadQrCodes = async () => {
      const codes: Record<string, string> = {};

      // Crear un Set de IDs de pulseras para evitar duplicados
      const pulseraIds = new Set<string>();

      // Agregar pulseras del contratante
      pulseras.forEach((p) => pulseraIds.add(p.id));

      // Agregar pulseras asignadas a portadores (si tienen)
      portadores.forEach((portador) => {
        const pulseraAsignada = pulseras.find(
          (p) => p.portador?.id === portador.id,
        );
        if (pulseraAsignada) {
          pulseraIds.add(pulseraAsignada.id);
        }
      });

      // Cargar QR para cada pulsera única
      for (const pulseraId of pulseraIds) {
        try {
          const { data } = await pulseraApi.generateQr(pulseraId);
          if (data?.qrImage) {
            codes[pulseraId] = data.qrImage;
          }
        } catch (err) {
          console.error(`Error loading QR for pulsera ${pulseraId}:`, err);
        }
      }

      setQrCodes(codes);
    };

    if (pulseras.length > 0 || portadores.length > 0) {
      loadQrCodes();
    }
  }, [pulseras, portadores]);

  // Handlers
  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo cerrar sesión.");
    }
  };

  // DEPRECATED: Ya no se pueden crear pulseras directamente
  // Solo se reclaman QRs físicos escaneados
  const handleCreate = () => {
    toast.error(
      "La creación directa está deshabilitada. Debes escanear el QR de un Bluko Life físico para reclamarlo.",
    );
  };

  const handleEdit = (pulsera: Pulsera) => {
    setEditingPulsera(pulsera);
    editForm.reset({
      name: pulsera.name || "",
      description: pulsera.description || "",
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    const ok = confirm(
      "¿Eliminar esta pulsera? Esta acción no se puede deshacer.",
    );
    if (!ok) return;

    try {
      await pulseraApi.delete(id);
      setPulseras((prev) => prev.filter((p) => p.id !== id));
      toast.success("Bluko Life eliminado.");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo eliminar.");
    }
  };

  const handleShowQr = async (pulsera: Pulsera) => {
    try {
      const { data } = await pulseraApi.generateQr(pulsera.id);
      // Si la API devuelve un blob o base64, ajustar según necesidad
      if (typeof data === "string" && data.startsWith("data:image")) {
        setQrImage(data);
      } else if (data instanceof Blob) {
        const url = URL.createObjectURL(data);
        setQrImage(url);
      } else {
        // Asumir que es una URL
        setQrImage(data.qrCode || data.url || data);
      }
      setShowQrModal(true);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo obtener el QR.");
    }
  };

  const handleDownloadQr = () => {
    try {
      const a = document.createElement("a");
      a.href = qrImage;
      a.download = "pulsera-qr.png";
      a.click();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo descargar el QR.");
    }
  };

  const handleCreateSubmit = async (data: PulseraFormData) => {
    try {
      // Create the pulsera first, then assign it
      const createData = {
        name: data.name,
        description: data.description,
      };
      const response = await pulseraApi.create(createData);

      // Now assign it to the portador
      const assignData = {
        portadorEmail: data.portadorEmail,
        portadorRut: data.portadorRut,
        firstName: data.firstName,
        paternalSurname: data.paternalSurname,
        maternalSurname: data.maternalSurname,
        medicalInfo: `Tipo de sangre: ${data.tipoSangre}\nCondiciones: ${data.condicionesMedicas}\nMedicamentos: ${data.medicamentos}\nAlergias: ${data.alergias}`,
      };

      await pulseraApi.assign(response.data.id, assignData);

      setPulseras((prev) => [...prev, { ...response.data, assigned: true }]);
      setAvailablePulseras((prev) => prev - 1);
      setShowCreateModal(false);
      createForm.reset();
      toast.success("Bluko Life asignado exitosamente al portador.");
    } catch (err) {
      console.error(err);
      if (
        err.response?.data?.error?.includes("disponibles") ||
        err.response?.data?.error?.includes("créditos")
      ) {
        toast.error(
          "No tienes créditos disponibles. Escanea un QR físico o compra más Bluko Life.",
        );
      } else {
        toast.error("Error al asignar el Bluko Life.");
      }
    }
  };

  const handleEditSubmit = async (data: PulseraFormData) => {
    if (!editingPulsera) return;

    try {
      const response = await pulseraApi.update(editingPulsera.id, data);
      setPulseras((prev) =>
        prev.map((p) => (p.id === editingPulsera.id ? response.data : p)),
      );
      setShowEditModal(false);
      setEditingPulsera(null);
      editForm.reset();
      toast.success("Bluko Life actualizado exitosamente.");
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar el Bluko Life.");
    }
  };

  const handleAssign = (pulsera: Pulsera) => {
    setAssigningPulsera(pulsera);
    setShowAssignModal(true);
    assignForm.reset();
    setPrincipiosActivosDetalle([]);
    setPatologiasDetalle([]);
    setContactosEmergenciaDetalle([]);
    setSearchStates({});
    setSearchStatesPatologias({});
    setFocusStates({});
    setFocusStatesPatologias({});
    setSelectedPortadorId("");
  };

  const handleEditAssignment = (pulsera: Pulsera) => {
    setAssigningPulsera(pulsera);
    setShowAssignModal(true);

    // Cargar datos existentes de la pulsera y portador
    assignForm.reset({
      portadorEmail: pulsera.portador?.email || "",
      portadorRut: pulsera.portador?.rut || "",
      firstName: pulsera.portador?.firstName || "",
      paternalSurname: pulsera.portador?.paternalSurname || "",
      maternalSurname: pulsera.portador?.maternalSurname || "",
      medicalInfo: pulsera.medicalInfo || "",
    });
  };

  const handleCreateUser = () => {
    setPortadorMode("add");
    setEditingUser(null);
    assignForm.reset();
    setPatologiasDetalle([]);
    setPrincipiosActivosDetalle([]);
    setContactosEmergenciaDetalle([]);
    setShowCreateUserModal(true);
  };

  const handleAssignPulseraToUser = async (portador: any) => {
    try {
      // Check if we have a pulsera to assign
      if (!assigningPulsera || !assigningPulsera.id) {
        toast.error(
          "No hay Bluko Life para asignar. Por favor, escanea un QR primero.",
        );
        return;
      }

      const loadingToast = toast.loading("Asignando Bluko Life al portador...");

      const assignData = {
        portadorEmail: portador.email,
        portadorRut: portador.rut,
        firstName: portador.firstName,
        paternalSurname: portador.paternalSurname,
        maternalSurname: portador.maternalSurname,
        medicalInfo: portador.medicalInfo || "",
        medicamentos: portador.medicamentos || "",
        enfermedadIds: portador.enfermedades?.map((e: any) => e.id) || [],
        principiosActivos:
          portador.principiosActivos?.map((p: any) => ({
            principioActivoId: p.principioActivo?.id || p.id,
            concentracion: p.concentracion || "",
            dosis: p.dosis || "",
            observaciones: p.observaciones || "",
          })) || [],
        contactosEmergencia:
          portador.contactosEmergencia?.map((c: any) => ({
            nombre: c.nombre,
            telefono: c.telefono,
          })) || [],
      };

      // Assign the existing pulsera (already claimed)
      await pulseraApi.assign(assigningPulsera.id, assignData);

      const portadoresResponse = await contratanteApi.getPortadores();
      setPortadores(
        Array.isArray(portadoresResponse.data)
          ? portadoresResponse.data
          : (portadoresResponse.data?.items ?? []),
      );

      await fetchPulseras();

      toast.dismiss(loadingToast);
      toast.success(`Pulsera asignada exitosamente a ${portador.firstName}!`);

      // Close modal
      setShowAssignModal(false);
      setAssigningPulsera(null);
    } catch (err: any) {
      console.error(err);
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Error al asignar el Bluko Life";
      toast.error(errorMsg);
    }
  };

  const handleCreateUserSubmit = async (data: AssignFormData) => {
    try {
      const portadorData = {
        email: data.portadorEmail,
        rut: data.portadorRut,
        firstName: data.firstName,
        paternalSurname: data.paternalSurname,
        maternalSurname: data.maternalSurname,
        grupoSanguineo: data.grupoSanguineo || "",
        peso: data.peso ? Number(data.peso) : null,
        estatura: data.estatura ? Number(data.estatura) : null,
        medicalInfo: data.medicalInfo,
        medicamentos: data.medicamentos || "",
        enfermedadIds: patologiasDetalle
          .filter((p) => !p.nombreCustom && p.enfermedadId > 0)
          .map((p) => p.enfermedadId),
        enfermedadesCustom: patologiasDetalle
          .filter((p) => p.nombreCustom)
          .map((p) => p.nombreCustom!),
        principiosActivos: principiosActivosDetalle
          .filter((p) => !p.nombreCustom && p.principioActivoId > 0),
        principiosActivosCustom: principiosActivosDetalle
          .filter((p) => p.nombreCustom)
          .map((p) => ({
            nombre: p.nombreCustom!,
            concentracion: p.concentracion,
            dosis: p.dosis,
            observaciones: p.observaciones,
          })),
        contactosEmergencia: contactosEmergenciaDetalle.filter(
          (c) => c.nombre && c.telefono,
        ),
      };

      await contratanteApi.createPortador(portadorData);

      const portadoresResponse = await contratanteApi.getPortadores();
      setPortadores(
        Array.isArray(portadoresResponse.data)
          ? portadoresResponse.data
          : (portadoresResponse.data?.items ?? []),
      );

      setShowCreateUserModal(false);
      assignForm.reset();
      setPatologiasDetalle([]);
      setPrincipiosActivosDetalle([]);
      setContactosEmergenciaDetalle([]);
      setSearchStates([]);
      setFocusStates([]);
      setSearchStatesPatologias([]);
      setFocusStatesPatologias([]);

      toast.success(
        "Portador creado exitosamente. Ahora puedes asignarle un Bluko Life.",
      );
    } catch (err: any) {
      console.error(err);
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Error al crear el portador";
      toast.error(errorMsg);
    }
  };

  const handleEditUser = (portador: any) => {
    setPortadorMode("edit");
    setEditingUser(portador);

    assignForm.reset({
      portadorEmail: portador.email,
      portadorRut: portador.rut,
      firstName: portador.firstName,
      paternalSurname: portador.paternalSurname,
      maternalSurname: portador.maternalSurname || "",
      grupoSanguineo: portador.grupoSanguineo || "",
      peso: portador.peso || "",
      estatura: portador.estatura || "",
      medicalInfo: portador.medicalInfo || "",
      medicamentos: portador.medicamentos || "",
    });

    const enfermedadesCustom: string[] = JSON.parse(portador.enfermedadesCustomJson || "[]");
    const principiosActivosCustom: any[] = JSON.parse(portador.principiosActivosCustomJson || "[]");

    setSearchStatesPatologias({});
    setFocusStatesPatologias({});
    setSearchStates({});
    setFocusStates({});

    setPatologiasDetalle([
      ...(portador.enfermedades?.map((e: any) => ({ enfermedadId: e.id })) || []),
      ...enfermedadesCustom.map((nombre: string) => ({ enfermedadId: 0, nombreCustom: nombre })),
    ]);

    setPrincipiosActivosDetalle([
      ...(portador.principiosActivos?.map((p: any) => ({
        principioActivoId: p.principioActivo?.id || p.id,
        concentracion: p.concentracion || "",
        dosis: p.dosis || "",
        observaciones: p.observaciones || "",
      })) || []),
      ...principiosActivosCustom.map((p: any) => ({
        principioActivoId: 0,
        concentracion: p.concentracion || "",
        dosis: p.dosis || "",
        observaciones: p.observaciones || "",
        nombreCustom: p.nombre,
      })),
    ]);

    setContactosEmergenciaDetalle(
      portador.contactosEmergencia?.map((c: any) => ({
        nombre: c.nombre,
        telefono: c.telefono,
      })) || [],
    );

    setShowCreateUserModal(true); // 👈 MISMO MODAL
  };

  const handleDeleteUser = async (portador: any) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar al portador ${portador.firstName} ${portador.paternalSurname}?`,
      )
    ) {
      return;
    }

    try {
      await contratanteApi.deletePortador(portador.id);

      const portadoresResponse = await contratanteApi.getPortadores();
      setPortadores(
        Array.isArray(portadoresResponse.data)
          ? portadoresResponse.data
          : (portadoresResponse.data?.items ?? []),
      );

      toast.success("Portador eliminado exitosamente.");
    } catch (err: any) {
      console.error(err);
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Error al eliminar el portador";
      toast.error(errorMsg);
    }
  };

  /*const handleAssignSubmit = async (data: AssignFormData) => {
    // Modo: Crear portador sin pulsera
    if (showCreateUserModal) {
      return handleCreateUserSubmit(data);
    }

    if (!assigningPulsera) return;

    try {
      // Si seleccionó un portador existente, usar sus datos
      if (selectedPortadorId) {
        const portador = portadores.find(
          (p) => p.id.toString() === selectedPortadorId,
        );
        if (portador) {
          data.portadorEmail = portador.email;
          data.portadorRut = portador.rut;
          data.firstName = portador.firstName;
          data.paternalSurname = portador.paternalSurname;
          data.maternalSurname = portador.maternalSurname;
        }
      }

      // Preparar datos de asignación
      const assignData = {
        portadorEmail: data.portadorEmail,
        portadorRut: data.portadorRut,
        firstName: data.firstName,
        paternalSurname: data.paternalSurname,
        maternalSurname: data.maternalSurname,
        medicalInfo: data.medicalInfo,
        medicamentos: data.medicamentos || "",
        enfermedadIds: patologiasDetalle
          .map((p) => p.enfermedadId)
          .filter((id) => id > 0),
        principiosActivos: principiosActivosDetalle,
        contactosEmergencia: contactosEmergenciaDetalle.filter(
          (c) => c.nombre && c.telefono,
        ),
      };

      if (assigningPulsera.id === "new") {
        // Para nueva pulsera: crear una pulsera básica primero
        const createData = {
          name: `Bluko Life de ${data.firstName}`,
          description: "Bluko Life personalizado",
        };
        const createResponse = await pulseraApi.create(createData);

        // Luego asignar la pulsera recién creada
        await pulseraApi.assign(createResponse.data.pulsera.id, assignData);

        setAvailablePulseras((prev) => prev - 1);
      } else {
        // Para pulsera existente: solo asignar
        await pulseraApi.assign(assigningPulsera.id, assignData);
      }

      // Recargar todas las pulseras y portadores desde el servidor
      const [pulserasResponse, portadoresResponse] = await Promise.all([
        pulseraApi.getAll(),
        contratanteApi.getPortadores(),
      ]);
      setPulseras(
        Array.isArray(pulserasResponse.data)
          ? pulserasResponse.data
          : (pulserasResponse.data?.items ?? []),
      );
      setPortadores(
        Array.isArray(portadoresResponse.data)
          ? portadoresResponse.data
          : (portadoresResponse.data?.items ?? []),
      );

      setShowAssignModal(false);
      setAssigningPulsera(null);
      assignForm.reset();
      setPatologiasDetalle([]);
      setPrincipiosActivosDetalle([]);
      setSearchStates({});
      setSelectedPortadorId("");
      toast.success("Bluko Life asignado exitosamente al portador.");
    } catch (err) {
      console.error(err);
      toast.error("Error al asignar el Bluko Life.");
    }
  };*/

  const handleAssignSubmit = async (data: AssignFormData) => {
  try {

    if (portadorMode === "add" && showCreateUserModal && !assigningPulsera) {
      return await handleCreateUserSubmit(data);
    }
    if (portadorMode === "edit" && editingUser) {
      const updateData = {
        firstName: data.firstName,
        paternalSurname: data.paternalSurname,
        maternalSurname: data.maternalSurname,
        grupoSanguineo: data.grupoSanguineo || "",
        peso: data.peso ? Number(data.peso) : null,
        estatura: data.estatura ? Number(data.estatura) : null,
        medicalInfo: data.medicalInfo,
        medicamentos: data.medicamentos || "",
        enfermedadIds: patologiasDetalle
          .filter((p) => !p.nombreCustom && p.enfermedadId > 0)
          .map((p) => p.enfermedadId),
        enfermedadesCustom: patologiasDetalle
          .filter((p) => p.nombreCustom)
          .map((p) => p.nombreCustom!),
        principiosActivos: principiosActivosDetalle
          .filter((p) => !p.nombreCustom && p.principioActivoId > 0),
        principiosActivosCustom: principiosActivosDetalle
          .filter((p) => p.nombreCustom)
          .map((p) => ({
            nombre: p.nombreCustom!,
            concentracion: p.concentracion,
            dosis: p.dosis,
            observaciones: p.observaciones,
          })),
        contactosEmergencia: contactosEmergenciaDetalle.filter(
          (c) => c.nombre && c.telefono,
        ),
      };

      await contratanteApi.updatePortador(editingUser.id, updateData);

      const portadoresResponse = await contratanteApi.getPortadores();
      setPortadores(
        Array.isArray(portadoresResponse.data)
          ? portadoresResponse.data
          : (portadoresResponse.data?.items ?? []),
      );

      setShowCreateUserModal(false);
      setEditingUser(null);
      assignForm.reset();
      setPatologiasDetalle([]);
      setPrincipiosActivosDetalle([]);
      setContactosEmergenciaDetalle([]);

      toast.success("Portador actualizado exitosamente.");
      return;
    }

    if (!assigningPulsera) return;

    if (selectedPortadorId) {
      const portador = portadores.find(
        (p) => p.id.toString() === selectedPortadorId,
      );
      if (portador) {
        data.portadorEmail = portador.email;
        data.portadorRut = portador.rut;
        data.firstName = portador.firstName;
        data.paternalSurname = portador.paternalSurname;
        data.maternalSurname = portador.maternalSurname;
      }
    }

    const assignData = {
      portadorEmail: data.portadorEmail,
      portadorRut: data.portadorRut,
      firstName: data.firstName,
      paternalSurname: data.paternalSurname,
      maternalSurname: data.maternalSurname,
      grupoSanguineo: data.grupoSanguineo || "",
      peso: data.peso ? Number(data.peso) : null,
      estatura: data.estatura ? Number(data.estatura) : null,
      medicalInfo: data.medicalInfo,
      medicamentos: data.medicamentos || "",
      enfermedadIds: patologiasDetalle
        .filter((p) => !p.nombreCustom && p.enfermedadId > 0)
        .map((p) => p.enfermedadId),
      enfermedadesCustom: patologiasDetalle
        .filter((p) => p.nombreCustom)
        .map((p) => p.nombreCustom!),
      principiosActivos: principiosActivosDetalle
        .filter((p) => !p.nombreCustom && p.principioActivoId > 0),
      principiosActivosCustom: principiosActivosDetalle
        .filter((p) => p.nombreCustom)
        .map((p) => ({
          nombre: p.nombreCustom!,
          concentracion: p.concentracion,
          dosis: p.dosis,
          observaciones: p.observaciones,
        })),
      contactosEmergencia: contactosEmergenciaDetalle.filter(
        (c) => c.nombre && c.telefono,
      ),
    };

    if (assigningPulsera.id === "new") {
      const createData = {
        name: `Bluko Life de ${data.firstName}`,
        description: "Bluko Life personalizado",
      };

      const createResponse = await pulseraApi.create(createData);
      await pulseraApi.assign(createResponse.data.pulsera.id, assignData);
      setAvailablePulseras((prev) => prev - 1);
    } else {
      await pulseraApi.assign(assigningPulsera.id, assignData);
    }

    const [pulserasResponse, portadoresResponse] = await Promise.all([
      pulseraApi.getAll(),
      contratanteApi.getPortadores(),
    ]);

    setPulseras(
      Array.isArray(pulserasResponse.data)
        ? pulserasResponse.data
        : (pulserasResponse.data?.items ?? []),
    );
    setPortadores(
      Array.isArray(portadoresResponse.data)
        ? portadoresResponse.data
        : (portadoresResponse.data?.items ?? []),
    );

    setShowAssignModal(false);
    setAssigningPulsera(null);
    assignForm.reset();
    setPatologiasDetalle([]);
    setPrincipiosActivosDetalle([]);
    setContactosEmergenciaDetalle([]);
    setSearchStates({});
    setSelectedPortadorId("");

    toast.success("Bluko Life asignado exitosamente al portador.");
  } catch (err) {
    console.error(err);
    toast.error("Error al procesar la acción.");
  }
};

  const handleActivateSubscription = async (pulseraId: string) => {
    try {
      const response = await pulseraApi.activateSubscription(pulseraId);

      setPulseras((prev) =>
        prev.map((p) =>
          p.id === pulseraId
            ? {
                ...p,
                subscriptionActive: response.data.subscriptionActive,
                subscriptionExpiresAt: response.data.subscriptionExpiresAt,
                daysRemaining: response.data.daysRemaining,
              }
            : p,
        ),
      );

      toast.success(
        response.data.message || "Suscripción activada exitosamente",
      );
    } catch (err) {
      console.error(err);
      toast.error("Error al activar la suscripción");
    }
  };

  const handleRenewSubscription = async (pulseraId: string) => {
    try {
      const response = await pulseraApi.renewSubscription(pulseraId);

      setPulseras((prev) =>
        prev.map((p) =>
          p.id === pulseraId
            ? {
                ...p,
                subscriptionActive: response.data.subscriptionActive,
                subscriptionExpiresAt: response.data.subscriptionExpiresAt,
                daysRemaining: response.data.daysRemaining,
              }
            : p,
        ),
      );

      toast.success(
        response.data.message || "Suscripción renovada exitosamente",
      );
    } catch (err) {
      console.error(err);
      toast.error("Error al renovar la suscripción");
    }
  };

  // Functions for managing emergency contacts table
  const addContactoEmergencia = () => {
    setContactosEmergenciaDetalle([
      ...contactosEmergenciaDetalle,
      {
        nombre: "",
        telefono: "",
      },
    ]);
  };

  const removeContactoEmergencia = (index: number) => {
    const nuevosContactos = contactosEmergenciaDetalle.filter(
      (_, i) => i !== index,
    );
    setContactosEmergenciaDetalle(nuevosContactos);
  };

  const updateContactoEmergencia = (
    index: number,
    field: string,
    value: string,
  ) => {
    const nuevosContactos = [...contactosEmergenciaDetalle];
    nuevosContactos[index] = { ...nuevosContactos[index], [field]: value };
    setContactosEmergenciaDetalle(nuevosContactos);
  };

  // Validation for contact name (only letters, spaces, accents)
  const isValidName = (name: string) => {
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name);
  };

  // Validation for phone number (only numbers, +, -, spaces, parentheses)
  const isValidPhone = (phone: string) => {
    return /^[0-9+\-\s()]+$/.test(phone);
  };

  // Functions for managing pathologies table
  const addPatologia = () => {
    const newIndex = patologiasDetalle.length;
    setPatologiasDetalle([
      ...patologiasDetalle,
      {
        enfermedadId: 0,
      },
    ]);
    setSearchStatesPatologias({ ...searchStatesPatologias, [newIndex]: "" });
    setFocusStatesPatologias({ ...focusStatesPatologias, [newIndex]: false });
  };

  const removePatologia = (index: number) => {
    const nuevosDetalles = patologiasDetalle.filter((_, i) => i !== index);
    setPatologiasDetalle(nuevosDetalles);

    // Remove search and focus states for this index and reindex
    const newSearchStates: Record<number, string> = {};
    const newFocusStates: Record<number, boolean> = {};

    Object.keys(searchStatesPatologias).forEach((key) => {
      const keyNum = parseInt(key);
      if (keyNum < index) {
        newSearchStates[keyNum] = searchStatesPatologias[keyNum];
        newFocusStates[keyNum] = focusStatesPatologias[keyNum] || false;
      } else if (keyNum > index) {
        newSearchStates[keyNum - 1] = searchStatesPatologias[keyNum];
        newFocusStates[keyNum - 1] = focusStatesPatologias[keyNum] || false;
      }
    });

    setSearchStatesPatologias(newSearchStates);
    setFocusStatesPatologias(newFocusStates);
  };

  const updatePatologia = (index: number, field: string, value: any) => {
    setPatologiasDetalle((prev) => {
      const nuevosDetalles = [...prev];
      nuevosDetalles[index] = { ...nuevosDetalles[index], [field]: value };
      return nuevosDetalles;
    });
  };

  const updateSearchStatePatologia = (index: number, searchTerm: string) => {
    setSearchStatesPatologias({
      ...searchStatesPatologias,
      [index]: searchTerm,
    });
  };

  const setFocusStatePatologia = (index: number, focused: boolean) => {
    setFocusStatesPatologias({ ...focusStatesPatologias, [index]: focused });
  };

  // Filter pathologies based on search term for specific row
  const getFilteredPatologias = (searchTerm: string) => {
    if (!searchTerm || searchTerm.length === 0) {
      // Show first 15 pathologies when no search term
      return enfermedades.slice(0, 15);
    }
    // Filter based on search term (minimum 1 character)
    return enfermedades.filter((enfermedad) =>
      enfermedad.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  // Functions for managing active principles table
  const addPrincipioActivo = () => {
    const newIndex = principiosActivosDetalle.length;
    setPrincipiosActivosDetalle([
      ...principiosActivosDetalle,
      {
        principioActivoId: 0,
        concentracion: "",
        dosis: "",
        observaciones: "",
      },
    ]);
    setSearchStates({ ...searchStates, [newIndex]: "" });
    setFocusStates({ ...focusStates, [newIndex]: false });
  };

  const removePrincipioActivo = (index: number) => {
    const nuevosDetalles = principiosActivosDetalle.filter(
      (_, i) => i !== index,
    );
    setPrincipiosActivosDetalle(nuevosDetalles);

    // Remove search and focus states for this index and reindex
    const newSearchStates: Record<number, string> = {};
    const newFocusStates: Record<number, boolean> = {};

    Object.keys(searchStates).forEach((key) => {
      const keyNum = parseInt(key);
      if (keyNum < index) {
        newSearchStates[keyNum] = searchStates[keyNum];
        newFocusStates[keyNum] = focusStates[keyNum] || false;
      } else if (keyNum > index) {
        newSearchStates[keyNum - 1] = searchStates[keyNum];
        newFocusStates[keyNum - 1] = focusStates[keyNum] || false;
      }
    });

    setSearchStates(newSearchStates);
    setFocusStates(newFocusStates);
  };

  const updatePrincipioActivo = (index: number, field: string, value: any) => {
    setPrincipiosActivosDetalle((prev) => {
      const nuevosDetalles = [...prev];
      nuevosDetalles[index] = { ...nuevosDetalles[index], [field]: value };
      return nuevosDetalles;
    });
  };

  const updateSearchState = (index: number, searchTerm: string) => {
    setSearchStates({ ...searchStates, [index]: searchTerm });
  };

  const setFocusState = (index: number, focused: boolean) => {
    setFocusStates({ ...focusStates, [index]: focused });
  };

  // Filter active principles based on search term for specific row
  const getFilteredPrincipiosActivos = (searchTerm: string) => {
    if (!searchTerm || searchTerm.length === 0) {
      // Show first 15 principles when no search term
      return principiosActivos.slice(0, 15);
    }
    // Filter based on search term (minimum 1 character)
    return principiosActivos.filter(
      (principio) =>
        principio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (principio.nombreComercial &&
          principio.nombreComercial
            .toLowerCase()
            .includes(searchTerm.toLowerCase())),
    );
  };

  const FormFields = ({ form }: { form: any }) => (
    <>
      {/* Datos del Portador */}
      <div>
        <h5 className="text-sm font-medium text-gray-900 mb-3">
          Datos del Portador
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email del Portador *
            </label>
            <input
              {...form.register("portadorEmail", {
                required: "El email es requerido",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Email inválido",
                },
              })}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="usuario@email.com"
            />
            {form.formState.errors.portadorEmail && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.portadorEmail.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RUT del Portador *
            </label>
            <input
              {...form.register("portadorRut", {
                required: "El RUT es requerido",
              })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="12.345.678-9"
            />
            {form.formState.errors.portadorRut && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.portadorRut.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              {...form.register("firstName", {
                required: "El nombre es requerido",
              })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Nombre"
            />
            {form.formState.errors.firstName && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido Paterno *
            </label>
            <input
              {...form.register("paternalSurname", {
                required: "El apellido paterno es requerido",
              })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Apellido Paterno"
            />
            {form.formState.errors.paternalSurname && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.paternalSurname.message}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido Materno
            </label>
            <input
              {...form.register("maternalSurname")}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Apellido Materno (opcional)"
            />
          </div>
        </div>
      </div>

      <div>
        <h5 className="text-sm font-medium text-gray-900 mb-3">
          Datos Físicos y Personales
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fecha de nacimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de nacimiento *
            </label>
            <input
              type="date"
              {...assignForm.register("fechaNacimiento", {
                required: "La fecha de nacimiento es requerida",
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
            />
            {assignForm.formState.errors.fechaNacimiento && (
              <p className="text-red-500 text-xs mt-1">
                {assignForm.formState.errors.fechaNacimiento.message}
              </p>
            )}
          </div>

          {/* Grupo sanguíneo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grupo sanguíneo
            </label>
            <select
              {...assignForm.register("grupoSanguineo")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
            >
              <option value="">Seleccionar...</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          {/* Peso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso (kg)
            </label>
            <input
              type="number"
              step="0.1"
              {...assignForm.register("peso", {
                min: { value: 1, message: "Peso inválido" },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Ej: 70"
            />
          </div>

          {/* Estatura */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estatura (cm)
            </label>
            <input
              type="number"
              {...assignForm.register("estatura", {
                min: { value: 30, message: "Estatura inválida" },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Ej: 170"
            />
          </div>
        </div>
      </div>

      {/* Contacto de emergencia */}
      <div>
        <h5 className="text-sm font-medium text-gray-900 mb-3">
          Contacto de emergencia
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del contacto *
            </label>
            <input
              {...form.register("contactoEmergencia", {
                required: "El contacto de emergencia es requerido",
              })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Nombre completo"
            />
            {form.formState.errors.contactoEmergencia && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.contactoEmergencia.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono de emergencia *
            </label>
            <input
              {...form.register("telefonoEmergencia", {
                required: "El teléfono es requerido",
              })}
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="+569 1234 5678"
            />
            {form.formState.errors.telefonoEmergencia && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.telefonoEmergencia.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Información médica */}
      <div>
        <h5 className="text-sm font-medium text-gray-900 mb-3">
          Información médica
        </h5>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condiciones médicas
            </label>
            <textarea
              {...form.register("condicionesMedicas")}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Diabetes, hipertensión, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medicamentos
            </label>
            <textarea
              {...form.register("medicamentos")}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Medicamentos que toma regularmente"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alergias
            </label>
            <textarea
              {...form.register("alergias")}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Alergias conocidas (medicamentos, alimentos, etc.)"
            />
          </div>
        </div>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-3 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-3 border-t-[#481468] animate-spin"></div>
            </div>
            <div className="mb-3">
              <Image
                src="/logo-bluko-icon.png"
                alt="Bluko"
                width={32}
                height={32}
                className="mx-auto animate-pulse"
              />
            </div>
          </div>
          <h2 className="text-lg font-bold bg-gradient-to-r from-[#481468] to-[#3d1158] bg-clip-text text-transparent mb-1">
            Cargando Dashboard
          </h2>
          <p className="text-sm text-gray-600">
            Preparando tu información médica...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-sm bg-white/95 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-bluko-icon.png"
              alt="Bluko Life"
              width={36}
              height={36}
              className="rounded-lg shadow-md"
            />
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-[#481468] to-[#3d1158] bg-clip-text text-transparent">
                Mi Panel
              </h1>
              <p className="text-[10px] text-gray-500">
                Gestion de Dispositivos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50">
              <User className="w-3.5 h-3.5 text-[#481468]" />
              <span className="text-xs font-medium text-gray-700">
                {user?.email ?? "Usuario"}
              </span>
            </div>

            <button
              onClick={() => router.push("/profile")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-[#481468] to-[#3d1158] text-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <User className="w-3.5 h-3.5" />
              <span className="font-medium">Mi Perfil</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="font-medium">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Hero */}
        <div
          className="mb-4 rounded-xl p-4 text-white shadow-lg animate-fadeIn relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #3d1158 0%, #481468 50%, #481468 100%)",
          }}
        >
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1 drop-shadow-lg">
                Bluko Life
              </h2>
              <p className="text-white text-sm opacity-95 drop-shadow">
                Gestiona la información médica y contactos de emergencia de
                forma segura
              </p>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Bluko Life Asignados */}
          <div className="bg-blue-50 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-scaleIn">
            <div className="flex items-start justify-between mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <QrCode className="w-4 h-4 text-blue-600" />
              </div>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Total
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-0.5 text-gray-900">{pulseras.filter((p) => p.portador !== null && p.portador !== undefined).length}</h3>
            <p className="text-blue-700 text-xs font-medium">
              {pulseras.filter((p) => p.portador !== null && p.portador !== undefined).length === 1
                ? "Bluko Life Asignado"
                : "Bluko Life Asignados"}
            </p>
            <p className="text-blue-400 text-[10px] mt-1">
              Usuarios con QR asignado
            </p>
          </div>

          {/* Bluko Life Disponibles */}
          <div
            className="bg-amber-50 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-scaleIn"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="bg-amber-100 p-2 rounded-lg">
                <ShoppingCart className="w-4 h-4 text-amber-600" />
              </div>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Comprados
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-0.5 text-gray-900">
              {availablePulseras}
            </h3>
            <p className="text-amber-700 text-xs font-medium">
              {availablePulseras === 1
                ? "Bluko Life Disponible"
                : "Bluko Life Disponibles"}
            </p>
            <p className="text-amber-400 text-[10px] mt-1">
              {availablePulseras > 0
                ? "Listos para asignar a un portador"
                : "Sin dispositivos pendientes de asignar"}
            </p>
          </div>

          {/* Suscripciones Activas */}
          <div
            className="bg-green-50 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-scaleIn"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <Activity className="w-4 h-4 text-green-600" />
              </div>
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5" />
                Estado
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-0.5 text-gray-900">
              {pulseras.length}
            </h3>
            <p className="text-green-700 text-xs font-medium">
              Suscripciones Activas
            </p>
            <p className="text-green-400 text-[10px] mt-1">
              Dispositivos adquiridos
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <div>
            <h3 className="text-base font-bold bg-gradient-to-r from-[#481468] to-[#3d1158] bg-clip-text text-transparent mb-0.5">
              Mis Bluko Life
            </h3>
            <p className="text-xs text-gray-600">
              Administra tu sistema de Bluko Life
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push("/subscription")}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-[#481468] to-[#3d1158] text-white font-medium hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Agregar dispositivos</span>
            </button>
            <button
              onClick={() => {
                if (claimedPulseraForAssignment) {
                  setAssigningPulsera(claimedPulseraForAssignment);
                  setShowAssignModal(true);
                  setClaimedPulseraForAssignment(null);
                  assignForm.reset();
                  setPatologiasDetalle([]);
                  setPrincipiosActivosDetalle([]);
                  setContactosEmergenciaDetalle([]);
                } else {
                  handleCreateUser();
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 ${
                claimedPulseraForAssignment
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white ring-2 ring-green-300 animate-pulse"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              }`}
              title={
                claimedPulseraForAssignment
                  ? `Crear nuevo portador y asignar QR reclamado (${claimedPulseraForAssignment.customId})`
                  : "Crear portador con información médica completa"
              }
            >
              <User className="w-4 h-4" />
              <span>
                {claimedPulseraForAssignment
                  ? "Crear Portador con QR Reclamado"
                  : "Crear Portador"}
              </span>
            </button>
          </div>
        </div>

        {/* Pulsera efectiva para asignar: estado explícito o primera sin portador del listado */}
        {(() => {
          const pendienteDeEstado = claimedPulseraForAssignment;
          const pendienteDeLista = pulseras.find((p: any) => !p.portador && !p.assigned);
          const efectiva = pendienteDeEstado || pendienteDeLista || null;
          if (efectiva && efectiva !== claimedPulseraForAssignment) {
            // Sincronizar el estado si el listado tiene una pulsera pendiente y el estado no
            setTimeout(() => setClaimedPulseraForAssignment(efectiva), 0);
          }
          return null;
        })()}

        {/* Banner: Pulseras reclamadas sin portador */}
        {pulseras.filter(p => !p.portador && !p.assigned).length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-4 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-amber-100 p-2 rounded-lg">
                <QrCode className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-amber-900">Bluko Life reclamado pendiente de asignar</p>
                <p className="text-xs text-amber-700">Selecciona un portador abajo para asignarlo</p>
              </div>
            </div>
            <div className="space-y-2">
              {pulseras.filter(p => !p.portador && !p.assigned).map(pulsera => (
                <div key={pulsera.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-amber-200">
                  <span className="font-mono font-bold text-gray-900 text-sm">{pulsera.customId || `ID: ${pulsera.id}`}</span>
                  <button
                    onClick={() => {
                      setClaimedPulseraForAssignment(pulsera);
                      toast('Ahora selecciona un portador y haz clic en "Asignar QR Reclamado"', { icon: '👇', duration: 5000 });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Preparar asignación
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Portadores Creados Section */}
        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 mb-4">
          <div className="bg-gradient-to-r from-[#481468] to-[#3d1158] p-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Portadores Creados ({portadores.length})
            </h3>
            <p className="text-xs text-white/80 mt-0.5">
              Lista de todos los portadores registrados
            </p>
          </div>

          {portadores.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                No hay portadores creados
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Crea un portador para comenzar
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {portadores.map((portador, index) => {
                // Buscar la pulsera MÁS RECIENTE asignada a este portador
                // Filtrar todas las pulseras del portador y ordenar por updatedAt desc
                const pulserasDelPortador = pulseras
                  .filter((p) => p.portador?.id === portador.id)
                  .sort((a, b) => {
                    // Ordenar por updatedAt descendente (más reciente primero)
                    const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                    const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                    return dateB - dateA;
                  });
                const pulseraAsignada = pulserasDelPortador[0] || null;
                const qrCodeAsignado = pulseraAsignada
                  ? qrCodes[pulseraAsignada.id]
                  : null;

                return (
                  <div
                    key={portador.id}
                    className="p-4 hover:bg-gray-50 transition-all duration-200 animate-fadeIn"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
                      <div className="flex gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          {qrCodeAsignado ? (
                            <div
                              className="w-14 h-14 border-2 border-[#481468] rounded-lg overflow-hidden bg-white cursor-pointer hover:ring-2 hover:ring-[#481468] transition-all duration-200"
                              onClick={() => {
                                setExpandedQrImage(qrCodeAsignado);
                                setExpandedQrUserName(
                                  `${portador.firstName} ${portador.paternalSurname}`,
                                );
                                setShowExpandedQrModal(true);
                              }}
                              title="Click para ver QR en tamaño completo"
                            >
                              <img
                                src={`data:image/png;base64,${qrCodeAsignado}`}
                                alt="QR Asignado"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 border-2 border-[#481468] rounded-full bg-gradient-to-br from-[#481468]/10 to-[#3d1158]/10 flex items-center justify-center">
                              <User className="w-7 h-7 text-[#481468]" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <h4 className="text-sm font-bold text-gray-900">
                              {portador.firstName} {portador.paternalSurname}
                            </h4>
                            {portador.verified ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm">
                                <CheckCircle className="w-2.5 h-2.5" />
                                Verificado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm">
                                <Clock className="w-2.5 h-2.5" />
                                Pendiente
                              </span>
                            )}
                            {pulseraAsignada && (
                              <>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#481468] to-[#3d1158] text-white shadow-sm">
                                  <QrCode className="w-2.5 h-2.5" />
                                  QR Asignado
                                </span>
                                {pulseraAsignada.subscriptionActive ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                    Suscripción Activa
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm">
                                    <Clock className="w-2.5 h-2.5" />
                                    Suscripción Inactiva
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-semibold">Email:</span>{" "}
                            {portador.email}
                          </p>
                          <p className="text-xs text-gray-600 font-mono">
                            <span className="font-semibold">RUT:</span>{" "}
                            {portador.rut}
                          </p>
                          {pulseraAsignada && (
                            <p className="text-xs text-[#481468] font-semibold mt-1">
                              <span className="font-semibold">Bluko Life:</span>{" "}
                              {pulseraAsignada.customId || pulseraAsignada.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:ml-auto">
                        <button
                          onClick={async () => {
                            if (claimedPulseraForAssignment) {
                              const loadingToast = toast.loading(
                                `Asignando QR a ${portador.firstName}...`,
                              );

                              try {
                                const assignData = {
                                  portadorEmail: portador.email,
                                  portadorRut: portador.rut,
                                  firstName: portador.firstName,
                                  paternalSurname: portador.paternalSurname,
                                  maternalSurname: portador.maternalSurname,
                                  medicalInfo: portador.medicalInfo,
                                  medicamentos: portador.medicamentos || "",
                                  enfermedadIds:
                                    portador.enfermedades?.map(
                                      (e: any) => e.id,
                                    ) || [],
                                  principiosActivos:
                                    portador.principiosActivos?.map(
                                      (pa: any) => ({
                                        principioActivoId:
                                          pa.principioActivo?.id ||
                                          pa.principioActivoId,
                                        concentracion: pa.concentracion || "",
                                        dosis: pa.dosis || "",
                                        observaciones: pa.observaciones || "",
                                      }),
                                    ) || [],
                                  contactosEmergencia:
                                    portador.contactosEmergencia?.map(
                                      (c: any) => ({
                                        nombre: c.nombre,
                                        telefono: c.telefono,
                                      }),
                                    ) || [],
                                };

                                await pulseraApi.assign(
                                  claimedPulseraForAssignment.id,
                                  assignData,
                                );

                                const [pulserasResponse, portadoresResponse] =
                                  await Promise.all([
                                    pulseraApi.getAll(),
                                    contratanteApi.getPortadores(),
                                  ]);

                                setPulseras(
                                  Array.isArray(pulserasResponse.data)
                                    ? pulserasResponse.data
                                    : (pulserasResponse.data?.items ?? []),
                                );
                                setPortadores(
                                  Array.isArray(portadoresResponse.data)
                                    ? portadoresResponse.data
                                    : (portadoresResponse.data?.items ?? []),
                                );

                                toast.dismiss(loadingToast);
                                toast.success(
                                  `¡QR ${claimedPulseraForAssignment.customId} asignado exitosamente a ${portador.firstName}!`,
                                );

                                setClaimedPulseraForAssignment(null);
                              } catch (err: any) {
                                toast.dismiss(loadingToast);
                                console.error(err);
                                const errorMsg =
                                  err.response?.data?.error ||
                                  err.response?.data?.message ||
                                  "Error al asignar el QR";
                                toast.error(errorMsg);
                              }
                            } else {
                              handleAssignPulseraToUser(portador);
                            }
                          }}
                          disabled={
                            !claimedPulseraForAssignment &&
                            availablePulseras <= 0
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg font-medium transition-all duration-300 transform ${
                            claimedPulseraForAssignment
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg hover:-translate-y-0.5 ring-2 ring-green-300 animate-pulse"
                              : availablePulseras > 0
                                ? "bg-gradient-to-r from-[#481468] to-[#3d1158] text-white hover:shadow-lg hover:-translate-y-0.5"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                          title={
                            claimedPulseraForAssignment
                              ? `Asignar QR reclamado (${claimedPulseraForAssignment.customId}) a este portador`
                              : availablePulseras <= 0
                                ? "No tienes Bluko Life disponibles"
                                : "Asignar Bluko Life a este portador con un click"
                          }
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>
                            {claimedPulseraForAssignment
                              ? "Asignar QR Reclamado"
                              : "Asignar Bluko Life"}
                          </span>
                        </button>
                        <button
                          onClick={() => handleEditUser(portador)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                          title="Editar información del portador"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(portador)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-all duration-300 shadow-sm hover:shadow-md"
                          title="Eliminar portador"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal QR */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl animate-scaleIn">
            <div className="mb-4">
              <h4 className="text-lg font-bold bg-gradient-to-r from-[#481468] to-[#3d1158] bg-clip-text text-transparent">
                Código QR
              </h4>
              <p className="text-xs text-gray-600 mt-0.5">
                Escanea o descarga el código
              </p>
            </div>
            {qrImage ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl mb-4">
                <img
                  src={qrImage}
                  alt="QR Bluko Life"
                  className="mx-auto w-48 h-48 object-contain"
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl mb-4">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-gray-200 border-t-[#481468] mb-2"></div>
                  <p className="text-sm text-gray-500">Cargando código QR...</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQrModal(false)}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
              >
                Cerrar
              </button>
              <button
                onClick={handleDownloadQr}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-2xl font-bold bg-gradient-to-r from-[#481468] to-[#3d1158] bg-clip-text text-transparent">
                  Asignar Bluko Life Inteligente
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Complete la información del portador
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={createForm.handleSubmit(handleCreateSubmit)}
              className="space-y-6"
            >
              <FormFields form={createForm} />

              <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 text-gray-700 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createForm.formState.isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {createForm.formState.isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Asignando...
                    </span>
                  ) : (
                    "Asignar Bluko Life"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {showEditModal && editingPulsera && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-2xl font-bold bg-gradient-to-r from-[#481468] to-[#3d1158] bg-clip-text text-transparent">
                  Editar:{" "}
                  {editingPulsera.name || `Bluko Life #${editingPulsera.id}`}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Actualiza la información del Bluko Life
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPulsera(null);
                }}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-6"
            >
              <FormFields form={editForm} />

              <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPulsera(null);
                  }}
                  className="flex-1 px-6 py-3 text-gray-700 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editForm.formState.isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {editForm.formState.isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Guardando...
                    </span>
                  ) : (
                    "Guardar Cambios"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Portador */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
            <div className="overflow-visible">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-2xl font-bold bg-gradient-to-r from-[#481468] to-[#3d1158] bg-clip-text text-transparent">
                    {portadorMode === "edit" ? "Editar Portador" : "Crear Nuevo Portador"}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {portadorMode === "edit"
                      ? `Actualiza la información de ${editingUser?.firstName} ${editingUser?.paternalSurname}`
                      : "Registra un nuevo portador con información médica completa"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setPortadorMode("add");
                    setEditingUser(null);
                    assignForm.reset();
                    setPatologiasDetalle([]);
                    setPrincipiosActivosDetalle([]);
                    setContactosEmergenciaDetalle([]);
                  }}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form
                onSubmit={assignForm.handleSubmit(handleAssignSubmit)}
                className="space-y-6"
              >
                {/* Datos del Portador */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">
                    Datos del Portador
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${portadorMode === "edit" ? "text-gray-500" : "text-gray-700"}`}>
                        Email del Portador *
                      </label>
                      <input
                        {...assignForm.register("portadorEmail", {
                          required: portadorMode === "add" ? "El email es requerido" : false,
                          pattern: portadorMode === "add" ? {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Email inválido",
                          } : undefined,
                        })}
                        type="email"
                        disabled={portadorMode === "edit"}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black ${portadorMode === "edit" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        placeholder="usuario@email.com"
                      />
                      {portadorMode === "edit" && (
                        <p className="text-xs text-gray-500 mt-1">
                          El email no se puede modificar
                        </p>
                      )}
                      {assignForm.formState.errors.portadorEmail && (
                        <p className="text-red-500 text-xs mt-1">
                          {assignForm.formState.errors.portadorEmail.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${portadorMode === "edit" ? "text-gray-500" : "text-gray-700"}`}>
                        RUT del Portador *
                      </label>
                      <input
                        {...assignForm.register("portadorRut", {
                          required: portadorMode === "add" ? "El RUT es requerido" : false,
                          validate: portadorMode === "add" ? (value) => {
                            const validation = validateRutWithMessage(value);
                            return validation.isValid || validation.message;
                          } : undefined,
                        })}
                        type="text"
                        disabled={portadorMode === "edit"}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black ${portadorMode === "edit" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        placeholder="20.283.752-3"
                        maxLength={12}
                        onChange={(e) => {
                          if (portadorMode === "add") {
                            const formatted = formatRutSimple(e.target.value);
                            e.target.value = formatted;
                            assignForm.setValue("portadorRut", formatted);
                            assignForm.trigger("portadorRut");
                          }
                        }}
                      />
                      {portadorMode === "edit" ? (
                        <p className="text-xs text-gray-500 mt-1">
                          El RUT no se puede modificar
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">
                          Ingresa números y dígito verificador (ej: 202837523).
                          Se formateará automáticamente.
                        </p>
                      )}
                      {assignForm.formState.errors.portadorRut && (
                        <p className="text-red-500 text-xs mt-1">
                          {assignForm.formState.errors.portadorRut.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        {...assignForm.register("firstName", {
                          required: "El nombre es requerido",
                        })}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
                        placeholder="Nombre"
                      />
                      {assignForm.formState.errors.firstName && (
                        <p className="text-red-500 text-xs mt-1">
                          {assignForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido Paterno *
                      </label>
                      <input
                        {...assignForm.register("paternalSurname", {
                          required: "El apellido paterno es requerido",
                        })}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
                        placeholder="Apellido Paterno"
                      />
                      {assignForm.formState.errors.paternalSurname && (
                        <p className="text-red-500 text-xs mt-1">
                          {assignForm.formState.errors.paternalSurname.message}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido Materno
                      </label>
                      <input
                        {...assignForm.register("maternalSurname")}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
                        placeholder="Apellido Materno (opcional)"
                      />
                    </div>
                  </div>
                </div>

                {/* Datos Físicos */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">
                    Datos Físicos
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grupo Sanguíneo
                      </label>
                      <select
                        {...assignForm.register("grupoSanguineo")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...assignForm.register("peso", {
                          min: { value: 1, message: "Peso inválido" },
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
                        placeholder="Ej: 70"
                      />
                      {assignForm.formState.errors.peso && (
                        <p className="text-red-500 text-xs mt-1">
                          {assignForm.formState.errors.peso.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estatura (cm)
                      </label>
                      <input
                        type="number"
                        {...assignForm.register("estatura", {
                          min: { value: 30, message: "Estatura inválida" },
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
                        placeholder="Ej: 170"
                      />
                      {assignForm.formState.errors.estatura && (
                        <p className="text-red-500 text-xs mt-1">
                          {assignForm.formState.errors.estatura.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información Médica */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">
                    Información Médica
                  </h5>
                  <div className="space-y-4">
                    {/* Contactos de emergencia */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Contactos de emergencia
                        </label>
                        <button
                          type="button"
                          onClick={addContactoEmergencia}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          <Plus className="w-3 h-3" />
                          Agregar
                        </button>
                      </div>

                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        {contactosEmergenciaDetalle.length > 0 ? (
                          <div className="divide-y divide-gray-200">
                            {contactosEmergenciaDetalle.map(
                              (contacto, index) => (
                                <div key={index} className="p-3 bg-white flex flex-col sm:flex-row gap-2 sm:items-center">
                                  <input
                                    type="text"
                                    value={contacto.nombre}
                                    onChange={(e) =>
                                      updateContactoEmergencia(
                                        index,
                                        "nombre",
                                        e.target.value,
                                      )
                                    }
                                    onBlur={(e) => {
                                      if (!isValidName(e.target.value)) {
                                        alert(
                                          "El nombre debe contener solo letras y espacios",
                                        );
                                        e.target.focus();
                                      }
                                    }}
                                    className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nombre completo"
                                  />
                                  <input
                                    type="text"
                                    value={contacto.telefono}
                                    onChange={(e) =>
                                      updateContactoEmergencia(
                                        index,
                                        "telefono",
                                        e.target.value,
                                      )
                                    }
                                    onBlur={(e) => {
                                      if (!isValidPhone(e.target.value)) {
                                        alert(
                                          "El teléfono debe contener solo números y caracteres válidos (+, -, espacios, paréntesis)",
                                        );
                                        e.target.focus();
                                      }
                                    }}
                                    className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Teléfono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeContactoEmergencia(index)
                                    }
                                    className="text-red-600 hover:text-red-800 self-end sm:self-center"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <div className="px-3 py-4 text-center text-gray-500 text-sm bg-white">
                            No hay contactos de emergencia agregados
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Patologías */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Patologías
                        </label>
                        <button
                          type="button"
                          onClick={addPatologia}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          <Plus className="w-3 h-3" />
                          Agregar
                        </button>
                      </div>

                      {patologiasDetalle.length > 0 && (
                        <div className="border border-gray-300 rounded-lg overflow-visible">
                          <div className="divide-y divide-gray-200">
                            {patologiasDetalle.map((detalle, index) => (
                              <div key={index} className="p-3 bg-white flex gap-2 items-start">
                                <div className="flex-1 min-w-0 relative">
                                  {detalle.nombreCustom ? (
                                    <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 border border-gray-300 rounded text-sm">
                                      <span className="flex-1 text-gray-800 font-medium">{detalle.nombreCustom}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          updatePatologia(index, "nombreCustom", undefined);
                                          updatePatologia(index, "enfermedadId", 0);
                                        }}
                                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <input
                                        type="text"
                                        value={
                                          detalle.enfermedadId
                                            ? enfermedades.find(
                                                (e) =>
                                                  e.id === detalle.enfermedadId,
                                              )?.nombre ||
                                              searchStatesPatologias[index] ||
                                              ""
                                            : searchStatesPatologias[index] ||
                                              ""
                                        }
                                        onChange={(e) =>
                                          updateSearchStatePatologia(
                                            index,
                                            e.target.value,
                                          )
                                        }
                                        onFocus={() => {
                                          setFocusStatePatologia(index, true);
                                          if (detalle.enfermedadId) {
                                            updatePatologia(
                                              index,
                                              "enfermedadId",
                                              0,
                                            );
                                            updateSearchStatePatologia(
                                              index,
                                              "",
                                            );
                                          }
                                        }}
                                        onBlur={() => {
                                          setTimeout(
                                            () =>
                                              setFocusStatePatologia(
                                                index,
                                                false,
                                              ),
                                            200,
                                          );
                                        }}
                                        className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Haz clic para ver lista o escribe para buscar..."
                                      />

                                      {(focusStatesPatologias[index] ||
                                        (searchStatesPatologias[index] &&
                                          searchStatesPatologias[index].length >
                                            0)) && (
                                        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                          {getFilteredPatologias(
                                            searchStatesPatologias[index] || "",
                                          ).length > 0 ? (
                                            getFilteredPatologias(
                                              searchStatesPatologias[index] ||
                                                "",
                                            )
                                              .slice(0, 15)
                                              .map((patologia) => (
                                                <button
                                                  key={patologia.id}
                                                  type="button"
                                                  onClick={() => {
                                                    updatePatologia(
                                                      index,
                                                      "enfermedadId",
                                                      patologia.id,
                                                    );
                                                    updateSearchStatePatologia(
                                                      index,
                                                      "",
                                                    );
                                                    setFocusStatePatologia(
                                                      index,
                                                      false,
                                                    );
                                                  }}
                                                  className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                                >
                                                  <div className="text-sm font-medium text-gray-900">
                                                    {patologia.nombre}
                                                  </div>
                                                </button>
                                              ))
                                          ) : searchStatesPatologias[index] ? (
                                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                              <div>
                                                No se encontraron patologías
                                              </div>
                                              <div className="text-xs mt-1">
                                                que coincidan con "
                                                {searchStatesPatologias[index]}"
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  updatePatologia(index, "nombreCustom", searchStatesPatologias[index]);
                                                  updatePatologia(index, "enfermedadId", 0);
                                                  updateSearchStatePatologia(index, "");
                                                  setFocusStatePatologia(index, false);
                                                }}
                                                className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                              >
                                                Agregar
                                              </button>
                                            </div>
                                          ) : (
                                            enfermedades.length === 0 && (
                                              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                Cargando patologías...
                                              </div>
                                            )
                                          )}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removePatologia(index)}
                                  className="text-red-600 hover:text-red-800 mt-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {patologiasDetalle.length === 0 && (
                        <div className="text-center py-8 text-gray-500 border border-gray-300 rounded-lg bg-gray-50">
                          <p className="text-sm">No hay patologías agregadas</p>
                          <p className="text-xs mt-1">
                            Haz clic en "Agregar" para añadir patologías
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Principios Activos */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Principios Activos (Medicamentos)
                        </label>
                        <button
                          type="button"
                          onClick={addPrincipioActivo}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          <Plus className="w-3 h-3" />
                          Agregar
                        </button>
                      </div>

                      {principiosActivosDetalle.length > 0 && (
                        <div className="border border-gray-300 rounded-lg overflow-visible">
                          <div className="divide-y divide-gray-200">
                            {principiosActivosDetalle.map(
                              (detalle, index) => (
                                <div key={index} className="p-3 bg-white space-y-2">
                                  <div className="flex gap-2 items-start">
                                    <div className="flex-1 min-w-0 relative">
                                      {detalle.nombreCustom ? (
                                        <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 border border-gray-300 rounded text-sm">
                                          <span className="flex-1 text-gray-800 font-medium">{detalle.nombreCustom}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              updatePrincipioActivo(index, "nombreCustom", undefined);
                                              updatePrincipioActivo(index, "principioActivoId", 0);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <input
                                            type="text"
                                            value={
                                              detalle.principioActivoId
                                                ? principiosActivos.find(
                                                    (p) =>
                                                      p.id ===
                                                      detalle.principioActivoId,
                                                  )?.nombre ||
                                                  searchStates[index] ||
                                                  ""
                                                : searchStates[index] || ""
                                            }
                                            onChange={(e) =>
                                              updateSearchState(
                                                index,
                                                e.target.value,
                                              )
                                            }
                                            onFocus={() => {
                                              setFocusState(index, true);
                                              if (detalle.principioActivoId) {
                                                updatePrincipioActivo(
                                                  index,
                                                  "principioActivoId",
                                                  0,
                                                );
                                                updateSearchState(index, "");
                                              }
                                            }}
                                            onBlur={() => {
                                              setTimeout(
                                                () => setFocusState(index, false),
                                                200,
                                              );
                                            }}
                                            className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="Buscar principio activo..."
                                          />

                                          {(focusStates[index] ||
                                            (searchStates[index] &&
                                              searchStates[index].length >
                                                0)) && (
                                            <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                              {getFilteredPrincipiosActivos(
                                                searchStates[index] || "",
                                              ).length > 0 ? (
                                                getFilteredPrincipiosActivos(
                                                  searchStates[index] || "",
                                                )
                                                  .slice(0, 15)
                                                  .map((principio) => (
                                                    <button
                                                      key={principio.id}
                                                      type="button"
                                                      onClick={() => {
                                                        updatePrincipioActivo(
                                                          index,
                                                          "principioActivoId",
                                                          principio.id,
                                                        );
                                                        updateSearchState(
                                                          index,
                                                          "",
                                                        );
                                                        setFocusState(
                                                          index,
                                                          false,
                                                        );
                                                      }}
                                                      className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                                    >
                                                      <div className="text-sm font-medium text-gray-900">
                                                        {principio.nombre}
                                                      </div>
                                                    </button>
                                                  ))
                                              ) : searchStates[index] ? (
                                                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                  <div>
                                                    No se encontraron principios
                                                    activos
                                                  </div>
                                                  <div className="text-xs mt-1">
                                                    que coincidan con "
                                                    {searchStates[index]}"
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      updatePrincipioActivo(index, "nombreCustom", searchStates[index]);
                                                      updatePrincipioActivo(index, "principioActivoId", 0);
                                                      updateSearchState(index, "");
                                                      setFocusState(index, false);
                                                    }}
                                                    className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                                  >
                                                    Agregar
                                                  </button>
                                                </div>
                                              ) : (
                                                principiosActivos.length ===
                                                  0 && (
                                                  <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                    Cargando principios activos...
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removePrincipioActivo(index)
                                      }
                                      className="text-red-600 hover:text-red-800 mt-1"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={detalle.concentracion}
                                      onChange={(e) =>
                                        updatePrincipioActivo(
                                          index,
                                          "concentracion",
                                          e.target.value,
                                        )
                                      }
                                      className="flex-1 min-w-0 px-2 py-1 text-sm text-black border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                      placeholder="Concentración (ej: 500mg)"
                                    />
                                    <input
                                      type="text"
                                      value={detalle.dosis}
                                      onChange={(e) =>
                                        updatePrincipioActivo(
                                          index,
                                          "dosis",
                                          e.target.value,
                                        )
                                      }
                                      className="flex-1 min-w-0 px-2 py-1 text-sm text-black border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                      placeholder="Dosis (ej: 1 cada 8h)"
                                    />
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {principiosActivosDetalle.length === 0 && (
                        <div className="text-center py-8 text-gray-500 border border-gray-300 rounded-lg bg-gray-50">
                          <p className="text-sm">
                            No hay principios activos agregados
                          </p>
                          <p className="text-xs mt-1">
                            Haz clic en "Agregar" para añadir medicamentos
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Información médica adicional */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Información Médica Adicional
                      </label>
                      <textarea
                        {...assignForm.register("medicalInfo")}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
                        placeholder="Alergias, observaciones médicas adicionales, etc."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateUserModal(false);
                      setPortadorMode("add");
                      setEditingUser(null);
                      assignForm.reset();
                      setPatologiasDetalle([]);
                      setPrincipiosActivosDetalle([]);
                      setContactosEmergenciaDetalle([]);
                    }}
                    className="flex-1 px-6 py-3 text-gray-700 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={assignForm.formState.isSubmitting}
                    className={`flex-1 px-6 py-3 text-white rounded-xl font-medium hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                      portadorMode === "edit"
                        ? "bg-gradient-to-r from-[#481468] to-[#3d1158]"
                        : "bg-gradient-to-r from-blue-600 to-blue-700"
                    }`}
                  >
                    {assignForm.formState.isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        {portadorMode === "edit" ? "Actualizando..." : "Creando..."}
                      </span>
                    ) : (
                      portadorMode === "edit" ? "Guardar Cambios" : "Crear Portador"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asignar Bluko Life */}
      {showAssignModal && assigningPulsera && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
            <div className="overflow-visible">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-2xl font-bold bg-gradient-to-r from-[#481468] to-[#3d1158] bg-clip-text text-transparent">
                    {assigningPulsera.portador
                      ? "Editar Asignación"
                      : "Asignar Bluko Life"}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {assigningPulsera.name ||
                      `Bluko Life #${assigningPulsera.id}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssigningPulsera(null);
                    setSelectedPortadorId("");
                  }}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form
                onSubmit={assignForm.handleSubmit(handleAssignSubmit)}
                className="space-y-6"
              >
                {/* Selección de Portador Existente o Nuevo */}
                {portadores.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      ¿Asignar a portador existente o crear nuevo?
                    </label>
                    <select
                      value={selectedPortadorId}
                      onChange={(e) => {
                        setSelectedPortadorId(e.target.value);
                        if (e.target.value) {
                          const portador = portadores.find(
                            (p) => p.id.toString() === e.target.value,
                          );
                          if (portador) {
                            assignForm.setValue(
                              "portadorEmail",
                              portador.email,
                            );
                            assignForm.setValue("portadorRut", portador.rut);
                            assignForm.setValue(
                              "firstName",
                              portador.firstName,
                            );
                            assignForm.setValue(
                              "paternalSurname",
                              portador.paternalSurname,
                            );
                            assignForm.setValue(
                              "maternalSurname",
                              portador.maternalSurname || "",
                            );
                          }
                        } else {
                          assignForm.reset();
                        }
                      }}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black bg-white"
                    >
                      <option value="">Crear nuevo portador</option>
                      {portadores.map((portador) => (
                        <option key={portador.id} value={portador.id}>
                          {portador.firstName} {portador.paternalSurname} -{" "}
                          {portador.email}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-600 mt-2">
                      Selecciona un portador existente o deja en "Crear nuevo
                      portador" para crear uno nuevo.
                    </p>
                  </div>
                )}

                {/* Datos del Portador */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">
                    Datos del Portador
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email del Portador *
                      </label>
                      <input
                        {...assignForm.register("portadorEmail", {
                          required: "El email es requerido",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Email inválido",
                          },
                        })}
                        type="email"
                        disabled={!!selectedPortadorId}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black ${selectedPortadorId ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        placeholder="usuario@email.com"
                      />
                      {assignForm.formState.errors.portadorEmail && (
                        <p className="text-red-500 text-xs mt-1">
                          {assignForm.formState.errors.portadorEmail.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RUT del Portador *
                      </label>
                      <input
                        {...assignForm.register("portadorRut", {
                          required: "El RUT es requerido",
                          validate: (value) => {
                            const validation = validateRutWithMessage(value);
                            return validation.isValid || validation.message;
                          },
                        })}
                        type="text"
                        disabled={!!selectedPortadorId}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black ${selectedPortadorId ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        placeholder="20.283.752-3"
                        maxLength={12}
                        onChange={(e) => {
                          const formatted = formatRutSimple(e.target.value);
                          e.target.value = formatted;
                          assignForm.setValue("portadorRut", formatted);
                          assignForm.trigger("portadorRut");
                        }}
                      />
                      {assignForm.formState.errors.portadorRut && (
                        <p className="text-red-500 text-xs mt-1">
                          {assignForm.formState.errors.portadorRut.message}
                        </p>
                      )}
                      {!selectedPortadorId && (
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Ingresa números y dígito verificador (ej:
                          202837523). Se formateará automáticamente.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        {...assignForm.register("firstName", {
                          required: "El nombre es requerido",
                        })}
                        type="text"
                        disabled={!!selectedPortadorId}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black ${selectedPortadorId ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        placeholder="Nombre"
                      />
                      {assignForm.formState.errors.firstName && (
                        <p className="text-red-500 text-xs mt-1">
                          {assignForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido Paterno *
                      </label>
                      <input
                        {...assignForm.register("paternalSurname", {
                          required: "El apellido paterno es requerido",
                        })}
                        type="text"
                        disabled={!!selectedPortadorId}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black ${selectedPortadorId ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        placeholder="Apellido Paterno"
                      />
                      {assignForm.formState.errors.paternalSurname && (
                        <p className="text-red-500 text-xs mt-1">
                          {assignForm.formState.errors.paternalSurname.message}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido Materno
                      </label>
                      <input
                        {...assignForm.register("maternalSurname")}
                        type="text"
                        disabled={!!selectedPortadorId}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black ${selectedPortadorId ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        placeholder="Apellido Materno (opcional)"
                      />
                    </div>
                  </div>
                </div>

                {/* Información de la Pulsera */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">
                    Información del Bluko Life
                  </h5>
                  <div className="space-y-4">
                    {/* Contactos de emergencia - Nueva tabla */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Contactos de emergencia
                        </label>
                        <button
                          type="button"
                          onClick={addContactoEmergencia}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          <Plus className="w-3 h-3" />
                          Agregar
                        </button>
                      </div>

                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        {contactosEmergenciaDetalle.length > 0 ? (
                          <div className="divide-y divide-gray-200">
                            {contactosEmergenciaDetalle.map(
                              (contacto, index) => (
                                <div key={index} className="p-3 bg-white flex flex-col sm:flex-row gap-2 sm:items-center">
                                  <input
                                    type="text"
                                    value={contacto.nombre}
                                    onChange={(e) =>
                                      updateContactoEmergencia(
                                        index,
                                        "nombre",
                                        e.target.value,
                                      )
                                    }
                                    onBlur={(e) => {
                                      if (!isValidName(e.target.value)) {
                                        alert(
                                          "El nombre debe contener solo letras y espacios",
                                        );
                                        e.target.focus();
                                      }
                                    }}
                                    className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nombre completo"
                                  />
                                  <input
                                    type="text"
                                    value={contacto.telefono}
                                    onChange={(e) =>
                                      updateContactoEmergencia(
                                        index,
                                        "telefono",
                                        e.target.value,
                                      )
                                    }
                                    onBlur={(e) => {
                                      if (!isValidPhone(e.target.value)) {
                                        alert(
                                          "El teléfono debe contener solo números y caracteres válidos (+, -, espacios, paréntesis)",
                                        );
                                        e.target.focus();
                                      }
                                    }}
                                    className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Teléfono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeContactoEmergencia(index)
                                    }
                                    className="text-red-600 hover:text-red-800 self-end sm:self-center"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <div className="px-3 py-4 text-center text-gray-500 text-sm bg-white">
                            No hay contactos de emergencia agregados
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Información Médica Estructurada */}
                    <div>
                      <h6 className="text-sm font-medium text-gray-900 mb-3">
                        Información Médica
                      </h6>
                      <div className="space-y-4">
                        {/* Patologías - Nueva tabla */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Patologías
                            </label>
                            <button
                              type="button"
                              onClick={addPatologia}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              <Plus className="w-3 h-3" />
                              Agregar
                            </button>
                          </div>

                          {patologiasDetalle.length > 0 && (
                            <div className="border border-gray-300 rounded-lg overflow-x-auto">
                              <table className="w-full text-sm min-w-[400px]">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Patología
                                    </th>
                                    <th className="w-12">
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {patologiasDetalle.map((detalle, index) => (
                                    <tr key={index}>
                                      <td className="px-3 py-2 relative">
                                        <div className="relative">
                                          {detalle.nombreCustom ? (
                                            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 border border-gray-300 rounded text-sm">
                                              <span className="flex-1 text-gray-800 font-medium">{detalle.nombreCustom}</span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  updatePatologia(index, "nombreCustom", undefined);
                                                  updatePatologia(index, "enfermedadId", 0);
                                                }}
                                                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ) : (
                                            <>
                                              <input
                                                type="text"
                                                value={
                                                  detalle.enfermedadId
                                                    ? enfermedades.find(
                                                        (e) =>
                                                          e.id ===
                                                          detalle.enfermedadId,
                                                      )?.nombre ||
                                                      searchStatesPatologias[index] ||
                                                      ""
                                                    : searchStatesPatologias[index] || ""
                                                }
                                                onChange={(e) =>
                                                  updateSearchStatePatologia(
                                                    index,
                                                    e.target.value,
                                                  )
                                                }
                                                onFocus={() => {
                                                  setFocusStatePatologia(index, true);
                                                  if (detalle.enfermedadId) {
                                                    updatePatologia(index, "enfermedadId", 0);
                                                    updateSearchStatePatologia(index, "");
                                                  }
                                                }}
                                                onBlur={() => {
                                                  setTimeout(
                                                    () => setFocusStatePatologia(index, false),
                                                    200,
                                                  );
                                                }}
                                                className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Haz clic para ver lista o escribe para buscar..."
                                              />

                                              {/* Dropdown de búsqueda */}
                                              {(focusStatesPatologias[index] ||
                                                (searchStatesPatologias[index] &&
                                                  searchStatesPatologias[index].length > 0)) && (
                                                <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                  {getFilteredPatologias(
                                                    searchStatesPatologias[index] || "",
                                                  ).length > 0 ? (
                                                    getFilteredPatologias(
                                                      searchStatesPatologias[index] || "",
                                                    )
                                                      .slice(0, 15)
                                                      .map((patologia) => (
                                                        <button
                                                          key={patologia.id}
                                                          type="button"
                                                          onClick={() => {
                                                            updatePatologia(index, "enfermedadId", patologia.id);
                                                            updateSearchStatePatologia(index, "");
                                                            setFocusStatePatologia(index, false);
                                                          }}
                                                          className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                                        >
                                                          <div className="text-sm font-medium text-gray-900">
                                                            {patologia.nombre}
                                                          </div>
                                                        </button>
                                                      ))
                                                  ) : searchStatesPatologias[index] ? (
                                                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                      <div>No se encontraron patologías</div>
                                                      <div className="text-xs mt-1">
                                                        que coincidan con "{searchStatesPatologias[index]}"
                                                      </div>
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          updatePatologia(index, "nombreCustom", searchStatesPatologias[index]);
                                                          updatePatologia(index, "enfermedadId", 0);
                                                          updateSearchStatePatologia(index, "");
                                                          setFocusStatePatologia(index, false);
                                                        }}
                                                        className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                                      >
                                                        Agregar
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    enfermedades.length === 0 && (
                                                      <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                        Cargando patologías...
                                                      </div>
                                                    )
                                                  )}
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        <button
                                          type="button"
                                          onClick={() => removePatologia(index)}
                                          className="text-red-600 hover:text-red-800"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {patologiasDetalle.length === 0 && (
                            <div className="text-center py-8 text-gray-500 border border-gray-300 rounded-lg bg-gray-50">
                              <p className="text-sm">
                                No hay patologías agregadas
                              </p>
                              <p className="text-xs mt-1">
                                Haz clic en "Agregar" para añadir patologías
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Principios Activos - Nueva tabla */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Principios Activos (Medicamentos)
                            </label>
                            <button
                              type="button"
                              onClick={addPrincipioActivo}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                              <Plus className="w-3 h-3" />
                              Agregar
                            </button>
                          </div>

                          {principiosActivosDetalle.length > 0 && (
                            <div className="border border-gray-300 rounded-lg overflow-x-auto">
                              <table className="w-full text-sm min-w-[400px]">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Principio Activo
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Concentración
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Dosis
                                    </th>
                                    <th className="w-12">
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {principiosActivosDetalle.map(
                                    (detalle, index) => (
                                      <tr key={index}>
                                        <td className="px-3 py-2 relative">
                                          <div className="relative">
                                            {detalle.nombreCustom ? (
                                              <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 border border-gray-300 rounded text-sm">
                                                <span className="flex-1 text-gray-800 font-medium">{detalle.nombreCustom}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    updatePrincipioActivo(index, "nombreCustom", undefined);
                                                    updatePrincipioActivo(index, "principioActivoId", 0);
                                                  }}
                                                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                                >
                                                  <X className="w-3 h-3" />
                                                </button>
                                              </div>
                                            ) : (
                                              <>
                                                <input
                                                  type="text"
                                                  value={
                                                    detalle.principioActivoId
                                                      ? principiosActivos.find(
                                                          (p) =>
                                                            p.id ===
                                                            detalle.principioActivoId,
                                                        )?.nombre ||
                                                        searchStates[index] ||
                                                        ""
                                                      : searchStates[index] || ""
                                                  }
                                                  onChange={(e) =>
                                                    updateSearchState(index, e.target.value)
                                                  }
                                                  onFocus={() => {
                                                    setFocusState(index, true);
                                                    if (detalle.principioActivoId) {
                                                      updatePrincipioActivo(index, "principioActivoId", 0);
                                                      updateSearchState(index, "");
                                                    }
                                                  }}
                                                  onBlur={() => {
                                                    setTimeout(() => setFocusState(index, false), 200);
                                                  }}
                                                  className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                  placeholder="Haz clic para ver lista o escribe para buscar..."
                                                />

                                                {/* Dropdown de búsqueda */}
                                                {(focusStates[index] ||
                                                  (searchStates[index] && searchStates[index].length > 0)) && (
                                                  <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                    {getFilteredPrincipiosActivos(
                                                      searchStates[index] || "",
                                                    ).length > 0 ? (
                                                      getFilteredPrincipiosActivos(
                                                        searchStates[index] || "",
                                                      )
                                                        .slice(0, 15)
                                                        .map((principio) => (
                                                          <button
                                                            key={principio.id}
                                                            type="button"
                                                            onClick={() => {
                                                              updatePrincipioActivo(index, "principioActivoId", principio.id);
                                                              updateSearchState(index, "");
                                                              setFocusState(index, false);
                                                            }}
                                                            className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                                          >
                                                            <div className="text-sm font-medium text-gray-900">
                                                              {principio.nombre}
                                                            </div>
                                                          </button>
                                                        ))
                                                    ) : searchStates[index] ? (
                                                      <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                        <div>No se encontraron principios activos</div>
                                                        <div className="text-xs mt-1">
                                                          que coincidan con "{searchStates[index]}"
                                                        </div>
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            updatePrincipioActivo(index, "nombreCustom", searchStates[index]);
                                                            updatePrincipioActivo(index, "principioActivoId", 0);
                                                            updateSearchState(index, "");
                                                            setFocusState(index, false);
                                                          }}
                                                          className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                                        >
                                                          Agregar
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      principiosActivos.length === 0 && (
                                                        <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                          Cargando principios activos...
                                                        </div>
                                                      )
                                                    )}
                                                  </div>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-3 py-2">
                                          <input
                                            type="text"
                                            value={detalle.concentracion}
                                            onChange={(e) =>
                                              updatePrincipioActivo(
                                                index,
                                                "concentracion",
                                                e.target.value,
                                              )
                                            }
                                            className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="ej: 500mg"
                                          />
                                        </td>
                                        <td className="px-3 py-2">
                                          <input
                                            type="text"
                                            value={detalle.dosis}
                                            onChange={(e) =>
                                              updatePrincipioActivo(
                                                index,
                                                "dosis",
                                                e.target.value,
                                              )
                                            }
                                            className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="ej: 1 cada 8h"
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removePrincipioActivo(index)
                                            }
                                            className="text-red-600 hover:text-red-800"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </td>
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {principiosActivosDetalle.length === 0 && (
                            <div className="text-center py-8 text-gray-500 border border-gray-300 rounded-lg bg-gray-50">
                              <p className="text-sm">
                                No hay principios activos agregados
                              </p>
                              <p className="text-xs mt-1">
                                Haz clic en "Agregar" para añadir medicamentos
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Medicamentos (texto libre) */}

                        {/* Información médica adicional */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Información Médica Adicional
                          </label>
                          <textarea
                            {...assignForm.register("medicalInfo")}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
                            placeholder="Alergias, observaciones médicas adicionales, etc."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignModal(false);
                      setAssigningPulsera(null);
                    }}
                    className="flex-1 px-6 py-3 text-gray-700 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={assignForm.formState.isSubmitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {assignForm.formState.isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        {assigningPulsera?.portador
                          ? "Actualizando..."
                          : "Asignando..."}
                      </span>
                    ) : assigningPulsera?.portador ? (
                      "Actualizar Asignación"
                    ) : (
                      "Asignar a Portador"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Expandido */}
      {showExpandedQrModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowExpandedQrModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                QR de {expandedQrUserName}
              </h3>
              <button
                onClick={() => setShowExpandedQrModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="w-full max-w-md aspect-square bg-white border-4 border-[#481468] rounded-2xl overflow-hidden p-4">
                <img
                  src={`data:image/png;base64,${expandedQrImage}`}
                  alt={`QR de ${expandedQrUserName}`}
                  className="w-full h-full object-contain"
                />
              </div>

              <p className="text-sm text-gray-600 text-center">
                Código QR para {expandedQrUserName}
              </p>

              <button
                onClick={() => setShowExpandedQrModal(false)}
                className="w-full px-4 py-2 bg-gradient-to-r from-[#481468] to-[#3d1158] text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
