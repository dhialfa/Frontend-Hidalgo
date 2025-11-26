// src/components/customers/CustomerContactsModal.tsx
import React, { useEffect, useState } from "react";
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
} from "../../api/customer/customer-contact.api"; // 👈 ajusta la ruta si es distinta
import type { Customer } from "../../api/customer/customer.api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
};

export default function CustomerContactsModal({ isOpen, onClose, customer }: Props) {
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactForm, setContactForm] = useState<Partial<CustomerContact>>({});
  const [editingContact, setEditingContact] = useState<CustomerContact | null>(null);

  // Cargar contactos cuando se abre el modal y hay cliente
  useEffect(() => {
    const loadContacts = async () => {
      if (!customer || !isOpen) return;
      setContactsLoading(true);
      try {
        // 🔹 getContactsByCustomer devuelve PageResp<CustomerContact>
        const page = await getContactsByCustomer(customer.id);
        setContacts(page.results); // ✅ aquí va .results
      } catch {
        setContacts([]);
      } finally {
        setContactsLoading(false);
      }
    };

    loadContacts();
  }, [customer, isOpen]);

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    try {
      if (editingContact) {
        // 🔹 updateCustomerContact devuelve AxiosResponse<CustomerContact>
        const res = await updateCustomerContact(editingContact.id, contactForm);
        const updated = res.data;
        setContacts((prev) =>
          prev.map((ct) => (ct.id === editingContact.id ? updated : ct))
        );
      } else {
        const payload = {
          name: contactForm.name ?? "",
          email: contactForm.email ?? "",
          phone: contactForm.phone ?? "",
          is_main: Boolean(contactForm.is_main),
        };
        if (!payload.name.trim() || !payload.email.trim()) {
          alert("Nombre y correo son requeridos");
          return;
        }
        // 🔹 createContactByCustomer también devuelve AxiosResponse<CustomerContact>
        const res = await createContactByCustomer(customer.id, payload);
        const created = res.data;
        setContacts((prev) => [created, ...prev]);
      }

      setContactForm({});
      setEditingContact(null);
    } catch {
      alert("Error al guardar contacto");
    }
  };

  const editContact = (ct: CustomerContact) => {
    setEditingContact(ct);
    setContactForm(ct);
  };

  const deleteContact = async (id: number) => {
    if (!confirm("¿Eliminar contacto?")) return;
    await deleteCustomerContact(id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const resetForm = () => {
    setEditingContact(null);
    setContactForm({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl p-6"
    >
      <h4 className="text-lg font-semibold mb-3 dark:text-white/90">
        {customer ? `Contactos de ${customer.name}` : "Contactos"}
      </h4>

      {!customer ? (
        <p className="text-sm text-gray-500">
          Selecciona un cliente para gestionar sus contactos.
        </p>
      ) : (
        <>
          <form
            onSubmit={submitContact}
            className="flex flex-wrap gap-3 items-end mb-6 border-b border-gray-100 pb-4 dark:border-white/[0.06]"
          >
            <input
              type="text"
              name="name"
              placeholder="Nombre"
              value={contactForm.name || ""}
              onChange={handleContactChange}
              className="dark:bg-dark-900 h-11 flex-1 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Correo"
              value={contactForm.email || ""}
              onChange={handleContactChange}
              className="dark:bg-dark-900 h-11 flex-1 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              required
            />
            <input
              type="text"
              name="phone"
              placeholder="Teléfono"
              value={contactForm.phone || ""}
              onChange={handleContactChange}
              className="dark:bg-dark-900 h-11 flex-1 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
              <input
                type="checkbox"
                name="is_main"
                checked={Boolean(contactForm.is_main)}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, is_main: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
              />
              Principal
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
              >
                {editingContact ? "Actualizar" : "Guardar"}
              </button>
              {editingContact && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border px-4 py-2.5 text-sm dark:border-gray-700"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {contactsLoading ? (
            <p className="text-sm text-gray-500">Cargando contactos...</p>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-gray-500">No hay contactos registrados.</p>
          ) : (
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  {["Nombre", "Correo", "Teléfono", "Principal", "Acciones"].map(
                    (h) => (
                      <TableCell
                        key={h}
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        {h}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {contacts.map((ct) => (
                  <TableRow key={ct.id}>
                    <TableCell className="text-gray-800 dark:text-white/90 text-theme-sm">
                      {ct.name}
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400 text-theme-sm">
                      {ct.email}
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400 text-theme-sm">
                      {ct.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge size="sm">{ct.is_main ? "Sí" : "No"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editContact(ct)}
                          className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteContact(ct.id)}
                          className="rounded-lg border border-red-500 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          Eliminar
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </Modal>
  );
}
