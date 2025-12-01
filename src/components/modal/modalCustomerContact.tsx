// src/components/customers/CustomerContactsModal.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal } from "../ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

import {
  getContactsByCustomer,
  createContactByCustomer,
  updateCustomerContact,
  deleteCustomerContact,
  type CustomerContact,
} from "../../api/customer/customer-contact.api";
import type { Customer } from "../../api/customer/customer.api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
};

// 🔹 Helper para convertir errores de Axios/DRF en array de strings
function buildErrorMessages(error: unknown, fallback: string): string[] {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as any;
    const msgs: string[] = [];

    if (!data) {
      msgs.push(fallback);
    } else if (typeof data === "string") {
      msgs.push(data);
    } else if (typeof data === "object") {
      if (data.detail) msgs.push(String(data.detail));
      if (data.message) msgs.push(String(data.message));
      if (Array.isArray(data.non_field_errors)) {
        msgs.push(...data.non_field_errors.map((m: any) => String(m)));
      }

      for (const [key, value] of Object.entries(data)) {
        if (["detail", "message", "non_field_errors"].includes(key)) continue;
        if (Array.isArray(value)) {
          msgs.push(`${key}: ${value.map((v) => String(v)).join(" ")}`);
        } else if (value) {
          msgs.push(`${key}: ${String(value)}`);
        }
      }

      if (msgs.length === 0) {
        msgs.push(fallback);
      }
    } else {
      msgs.push(fallback);
    }

    return msgs;
  }

  return [fallback];
}

export default function CustomerContactsModal({
  isOpen,
  onClose,
  customer,
}: Props) {
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactForm, setContactForm] = useState<Partial<CustomerContact>>({});
  const [editingContact, setEditingContact] = useState<CustomerContact | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  // 🔹 Errores globales del modal (carga, guardar, borrar)
  const [errors, setErrors] = useState<string[]>([]);

  // Cargar contactos cuando se abre el modal y hay cliente
  useEffect(() => {
    const loadContacts = async () => {
      if (!customer || !isOpen) return;
      setContactsLoading(true);
      setErrors([]);
      try {
        const page = await getContactsByCustomer(customer.id);
        setContacts(page.results);
      } catch (err) {
        console.error("contacts load error:", err);
        setContacts([]);
        setErrors(buildErrorMessages(err, "Error al cargar contactos."));
      } finally {
        setContactsLoading(false);
      }
    };

    if (isOpen) {
      setErrors([]);
      setContactForm({});
      setEditingContact(null);
      void loadContacts();
    }
  }, [customer, isOpen]);

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    const payload = {
      name: contactForm.name ?? "",
      email: contactForm.email ?? "",
      phone: contactForm.phone ?? "",
      is_main: !!contactForm.is_main,
    };

    const localErrors: string[] = [];
    if (!payload.name.trim()) localErrors.push("El nombre es obligatorio.");
    if (!payload.email.trim()) localErrors.push("El correo es obligatorio.");

    if (localErrors.length > 0) {
      setErrors(localErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors([]);

      if (editingContact) {
        const updated = await updateCustomerContact(editingContact.id, payload);
        setContacts((prev) =>
          prev.map((ct) => (ct.id === editingContact.id ? updated : ct)),
        );
      } else {
        const created = await createContactByCustomer(customer.id, payload);
        setContacts((prev) => [created, ...prev]);
      }

      setContactForm({});
      setEditingContact(null);
    } catch (err) {
      console.error("contact submit error:", err);
      setErrors(buildErrorMessages(err, "Error al guardar contacto."));
    } finally {
      setSaving(false);
    }
  };

  const editContact = (ct: CustomerContact) => {
    setEditingContact(ct);
    setErrors([]);
    // rellenamos solo lo que usamos en el formulario
    setContactForm({
      name: ct.name,
      email: ct.email,
      phone: ct.phone,
      is_main: ct.is_main,
    });
  };

  const deleteContact = async (id: number) => {
    if (!confirm("¿Eliminar contacto?")) return;
    setSaving(true);
    setErrors([]);
    try {
      await deleteCustomerContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      if (editingContact?.id === id) {
        setEditingContact(null);
        setContactForm({});
      }
    } catch (err) {
      console.error("contact delete error:", err);
      setErrors(buildErrorMessages(err, "No se pudo eliminar el contacto."));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingContact(null);
    setContactForm({});
    setErrors([]);
  };

  const handleClose = () => {
    setErrors([]);
    setEditingContact(null);
    setContactForm({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-3xl p-6">
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-semibold mb-1 dark:text-white/90">
            {customer ? `Contactos de ${customer.name}` : "Contactos"}
          </h4>
          {customer && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Administra los contactos que recibirán notificaciones por correo.
            </p>
          )}
        </div>

        {/* 🔹 Bloque de errores */}
        {errors.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
            <ul className="list-disc pl-5 space-y-1">
              {errors.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {!customer ? (
          <p className="text-sm text-gray-500">
            Selecciona un cliente para gestionar sus contactos.
          </p>
        ) : (
          <>
            {/* Formulario */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 dark:border-white/[0.06] dark:bg-gray-900/60">
              <form
                onSubmit={submitContact}
                className="flex flex-wrap gap-3 items-end"
              >
                <div className="flex flex-1 flex-col gap-3 md:flex-row">
                  <input
                    type="text"
                    name="name"
                    placeholder="Nombre"
                    value={contactForm.name || ""}
                    onChange={handleContactChange}
                    className="dark:bg-dark-900 h-11 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    required
                    disabled={saving}
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Correo"
                    value={contactForm.email || ""}
                    onChange={handleContactChange}
                    className="dark:bg-dark-900 h-11 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    required
                    disabled={saving}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <input
                    type="text"
                    name="phone"
                    placeholder="Teléfono"
                    value={contactForm.phone || ""}
                    onChange={handleContactChange}
                    className="dark:bg-dark-900 h-11 min-w-[160px] flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    disabled={saving}
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
                    <input
                      type="checkbox"
                      name="is_main"
                      checked={Boolean(contactForm.is_main)}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          is_main: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
                      disabled={saving}
                    />
                    Principal
                  </label>
                </div>

                <div className="flex gap-2 ml-auto">
                  {editingContact && (
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={saving}
                      className="rounded-lg border px-4 py-2.5 text-xs dark:border-gray-700 text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/10 disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-brand-500 px-4 py-2.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    {saving
                      ? "Guardando..."
                      : editingContact
                      ? "Actualizar"
                      : "Guardar"}
                  </button>
                </div>
              </form>
            </div>

            {/* Tabla */}
            {contactsLoading ? (
              <p className="text-sm text-gray-500 mt-2">
                Cargando contactos...
              </p>
            ) : contacts.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">
                No hay contactos registrados.
              </p>
            ) : (
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-gray-900/70">
                <Table>
                  <TableHeader className="border-b border-gray-100 bg-gray-50/70 dark:border-white/[0.05] dark:bg-gray-900">
                    <TableRow>
                      {[
                        "Nombre",
                        "Correo",
                        "Teléfono",
                        "Principal",
                        "Acciones",
                      ].map((h) => (
                        <TableCell
                          key={h}
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-[11px] uppercase tracking-wide dark:text-gray-400"
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {contacts.map((ct) => (
                      <TableRow
                        key={ct.id}
                        className="hover:bg-gray-50/70 dark:hover:bg-white/[0.04]"
                      >
                        <TableCell className="px-5 py-3 text-gray-800 dark:text-white/90 text-theme-sm">
                          {ct.name}
                        </TableCell>
                        <TableCell className="px-5 py-3 text-gray-500 dark:text-gray-400 text-theme-sm">
                          <a
                            href={`mailto:${ct.email}`}
                            className="hover:underline"
                          >
                            {ct.email}
                          </a>
                        </TableCell>
                        <TableCell className="px-5 py-3 text-gray-500 dark:text-gray-400 text-theme-sm">
                          {ct.phone || "—"}
                        </TableCell>
                        <TableCell className="px-5 py-3">
                          <Badge size="sm">
                            {ct.is_main ? "Sí" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => editContact(ct)}
                              disabled={saving}
                              className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06] disabled:opacity-60"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => void deleteContact(ct.id)}
                              disabled={saving}
                              className="rounded-lg border border-red-500 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-60"
                            >
                              Eliminar
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
