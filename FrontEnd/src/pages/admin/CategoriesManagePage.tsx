import React, { useEffect, useState } from 'react';
import { categoriasApi } from '../../api';
import {
  CategoriaPadre,
  CreateCategoriaPadreDTO,
  Subcategoria,
  CreateSubcategoriaDTO,
} from '../../types/categoria.types';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Layers,
  Plus,
  Edit2,
  FolderTree,
  X,
  Tag,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/categories.css';

export const CategoriesManagePage: React.FC = () => {
  const [padres, setPadres] = useState<CategoriaPadre[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Modal: Categoría Padre
  const [modalPadreOpen, setModalPadreOpen] = useState(false);
  const [editingPadre, setEditingPadre] = useState<CategoriaPadre | null>(null);
  const [formPadre, setFormPadre] = useState<CreateCategoriaPadreDTO>({
    nombre: '',
    descripcion: '',
    activo: true,
  });

  // Modal: Subcategoría
  const [modalSubOpen, setModalSubOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcategoria | null>(null);
  const [formSub, setFormSub] = useState<CreateSubcategoriaDTO>({
    idCategoriaPadre: 0,
    nombre: '',
    descripcion: '',
    activo: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [padresRes, subsRes] = await Promise.all([
        categoriasApi.listarPadres(1, 100),
        categoriasApi.listarSubcategorias(1, 100),
      ]);
      setPadres(padresRes || []);
      setSubcategorias(subsRes || []);
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al cargar categorías',
        description: error.message || 'No fue posible cargar el árbol de categorías',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers Padre ---
  const handleOpenCreatePadre = () => {
    setEditingPadre(null);
    setFormPadre({ nombre: '', descripcion: '', activo: true });
    setModalPadreOpen(true);
  };

  const handleOpenEditPadre = (padre: CategoriaPadre) => {
    setEditingPadre(padre);
    setFormPadre({
      nombre: padre.nombre,
      descripcion: padre.descripcion || '',
      activo: padre.activo,
    });
    setModalPadreOpen(true);
  };

  const handleSubmitPadre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPadre.nombre.trim()) return;

    try {
      setSaving(true);
      if (editingPadre) {
        await categoriasApi.actualizarPadre(editingPadre.id, formPadre);
        showToast({
          type: 'success',
          title: 'Categoría actualizada',
          description: `Categoría "${formPadre.nombre}" actualizada.`,
        });
      } else {
        await categoriasApi.crearPadre(formPadre);
        showToast({
          type: 'success',
          title: 'Categoría creada',
          description: `Categoría "${formPadre.nombre}" añadida exitosamente.`,
        });
      }
      setModalPadreOpen(false);
      await cargarDatos();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error en categoría padre',
        description: error.message || 'El nombre ya existe o los datos son inválidos.',
      });
    } finally {
      setSaving(false);
    }
  };

  // --- Handlers Subcategoría ---
  const handleOpenCreateSub = (idPadre?: number) => {
    setEditingSub(null);
    setFormSub({
      idCategoriaPadre: idPadre || padres[0]?.id || 1,
      nombre: '',
      descripcion: '',
      activo: true,
    });
    setModalSubOpen(true);
  };

  const handleOpenEditSub = (sub: Subcategoria) => {
    setEditingSub(sub);
    setFormSub({
      idCategoriaPadre: sub.idCategoriaPadre,
      nombre: sub.nombre,
      descripcion: sub.descripcion || '',
      activo: sub.activo,
    });
    setModalSubOpen(true);
  };

  const handleSubmitSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSub.nombre.trim()) return;

    try {
      setSaving(true);
      if (editingSub) {
        await categoriasApi.actualizarSubcategoria(editingSub.id, formSub);
        showToast({
          type: 'success',
          title: 'Subcategoría actualizada',
          description: `Subcategoría "${formSub.nombre}" actualizada.`,
        });
      } else {
        await categoriasApi.crearSubcategoria(formSub);
        showToast({
          type: 'success',
          title: 'Subcategoría creada',
          description: `Subcategoría "${formSub.nombre}" agregada.`,
        });
      }
      setModalSubOpen(false);
      await cargarDatos();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error en subcategoría',
        description: error.message || 'Verifica los datos ingresados.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="categories-page">
      {/* Top Header */}
      <div className="categories-page__header">
        <div>
          <div className="categories-page__breadcrumbs">
            <Link to="/admin" className="categories-page__breadcrumb-link">
              Panel Admin
            </Link>
            <span className="categories-page__breadcrumb-sep">/</span>
            <span className="categories-page__breadcrumb-current">Categorías y Subcategorías</span>
          </div>
          <h1 className="categories-page__title">
            <FolderTree className="categories-page__title-icon" />
            Estructura Jerárquica de Categorías
          </h1>
          <p className="categories-page__subtitle">
            Organiza los productos en Categorías Padre y ramas de Subcategorías con sincronización relacional.
          </p>
        </div>

        <div className="categories-page__actions">
          <button
            onClick={cargarDatos}
            className="categories-page__btn-reload"
            title="Recargar árbol"
          >
            <RefreshCw className="categories-page__btn-icon" />
          </button>
          <button
            onClick={() => handleOpenCreateSub()}
            className="categories-page__btn-secondary"
          >
            <Plus className="categories-page__btn-icon categories-page__btn-icon--amber" />
            <span>Nueva Subcategoría</span>
          </button>
          <button
            onClick={handleOpenCreatePadre}
            className="categories-page__btn-primary"
          >
            <Plus className="categories-page__btn-icon" />
            <span>Nueva Categoría Padre</span>
          </button>
        </div>
      </div>

      {/* Tree / Cards layout */}
      {loading ? (
        <LoadingSpinner label="Cargando jerarquía de categorías..." size="lg" />
      ) : padres.length === 0 ? (
        <div className="categories-page__empty-card">
          <p className="categories-page__empty-text">No existen categorías creadas aún.</p>
        </div>
      ) : (
        <div className="categories-grid">
          {padres.map((padre) => {
            const subsDelPadre = subcategorias.filter((s) => s.idCategoriaPadre === padre.id);

            return (
              <div key={padre.id} className="category-card">
                {/* Padre Header */}
                <div className="category-card__header">
                  <div className="category-card__info">
                    <div className="category-card__icon-box">
                      <Layers className="category-card__icon" />
                    </div>
                    <div className="category-card__title-group">
                      <h3 className="category-card__title">
                        {padre.nombre}
                        <span className="category-card__id-badge">
                          (ID #{padre.id})
                        </span>
                      </h3>
                      <p className="category-card__description">
                        {padre.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                  </div>

                  <div className="category-card__header-actions">
                    <button
                      onClick={() => handleOpenEditPadre(padre)}
                      className="category-card__action-btn"
                      title="Editar categoría padre"
                    >
                      <Edit2 className="category-card__action-icon" />
                    </button>
                    <button
                      onClick={() => handleOpenCreateSub(padre.id)}
                      className="category-card__action-btn category-card__action-btn--add"
                      title="Añadir subcategoría aquí"
                    >
                      <Plus className="category-card__action-icon" />
                    </button>
                  </div>
                </div>

                {/* Subcategories Pill List */}
                <div className="category-card__subcats-section">
                  <span className="category-card__subcats-title">
                    Subcategorías Hijas ({subsDelPadre.length})
                  </span>

                  {subsDelPadre.length === 0 ? (
                    <p className="category-card__subcats-empty">
                      Sin subcategorías vinculadas. Haz clic en '+' para agregar una.
                    </p>
                  ) : (
                    <div className="category-card__pills">
                      {subsDelPadre.map((sub) => (
                        <div key={sub.id} className="category-pill">
                          <Tag className="category-pill__icon" />
                          <span className="category-pill__name">{sub.nombre}</span>
                          <span className="category-pill__id">#{sub.id}</span>
                          <button
                            onClick={() => handleOpenEditSub(sub)}
                            className="category-pill__edit-btn"
                            title="Editar subcategoría"
                          >
                            <Edit2 className="category-pill__edit-icon" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Categoría Padre */}
      {modalPadreOpen && (
        <div className="category-modal__backdrop">
          <div className="category-modal__dialog">
            <div className="category-modal__header">
              <h3 className="category-modal__title">
                <Layers className="category-modal__title-icon" />
                {editingPadre ? 'Editar Categoría Padre' : 'Nueva Categoría Padre'}
              </h3>
              <button
                onClick={() => setModalPadreOpen(false)}
                className="category-modal__close-btn"
              >
                <X className="category-modal__close-icon" />
              </button>
            </div>

            <form onSubmit={handleSubmitPadre} className="category-modal__form">
              <div className="category-modal__form-group">
                <label className="category-modal__label">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formPadre.nombre}
                  onChange={(e) => setFormPadre({ ...formPadre, nombre: e.target.value })}
                  placeholder="Ej: Métodos de Extracción"
                  className="category-modal__input"
                />
              </div>

              <div className="category-modal__form-group">
                <label className="category-modal__label">Descripción</label>
                <textarea
                  rows={3}
                  value={formPadre.descripcion || ''}
                  onChange={(e) => setFormPadre({ ...formPadre, descripcion: e.target.value })}
                  placeholder="Descripción del grupo principal de productos"
                  className="category-modal__textarea"
                />
              </div>

              <div className="category-modal__checkbox-row">
                <input
                  type="checkbox"
                  id="padreActivo"
                  checked={formPadre.activo}
                  onChange={(e) => setFormPadre({ ...formPadre, activo: e.target.checked })}
                  className="category-modal__checkbox"
                />
                <label htmlFor="padreActivo" className="category-modal__checkbox-label">
                  Categoría Activa
                </label>
              </div>

              <div className="category-modal__footer">
                <button
                  type="button"
                  onClick={() => setModalPadreOpen(false)}
                  className="category-modal__btn-cancel"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="category-modal__btn-submit"
                >
                  {saving ? 'Guardando...' : editingPadre ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Subcategoría */}
      {modalSubOpen && (
        <div className="category-modal__backdrop">
          <div className="category-modal__dialog">
            <div className="category-modal__header">
              <h3 className="category-modal__title">
                <Tag className="category-modal__title-icon" />
                {editingSub ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
              </h3>
              <button
                onClick={() => setModalSubOpen(false)}
                className="category-modal__close-btn"
              >
                <X className="category-modal__close-icon" />
              </button>
            </div>

            <form onSubmit={handleSubmitSub} className="category-modal__form">
              <div className="category-modal__form-group">
                <label className="category-modal__label">Categoría Padre Asociada *</label>
                <select
                  required
                  value={formSub.idCategoriaPadre}
                  onChange={(e) => setFormSub({ ...formSub, idCategoriaPadre: Number(e.target.value) })}
                  className="category-modal__select"
                >
                  {padres.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (ID #{p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="category-modal__form-group">
                <label className="category-modal__label">Nombre de la Subcategoría *</label>
                <input
                  type="text"
                  required
                  value={formSub.nombre}
                  onChange={(e) => setFormSub({ ...formSub, nombre: e.target.value })}
                  placeholder="Ej: Cafetera Prensa Francesa"
                  className="category-modal__input"
                />
              </div>

              <div className="category-modal__form-group">
                <label className="category-modal__label">Descripción</label>
                <textarea
                  rows={3}
                  value={formSub.descripcion || ''}
                  onChange={(e) => setFormSub({ ...formSub, descripcion: e.target.value })}
                  placeholder="Detalles específicos de la subcategoría"
                  className="category-modal__textarea"
                />
              </div>

              <div className="category-modal__checkbox-row">
                <input
                  type="checkbox"
                  id="subActivo"
                  checked={formSub.activo}
                  onChange={(e) => setFormSub({ ...formSub, activo: e.target.checked })}
                  className="category-modal__checkbox"
                />
                <label htmlFor="subActivo" className="category-modal__checkbox-label">
                  Subcategoría Activa
                </label>
              </div>

              <div className="category-modal__footer">
                <button
                  type="button"
                  onClick={() => setModalSubOpen(false)}
                  className="category-modal__btn-cancel"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="category-modal__btn-submit"
                >
                  {saving ? 'Guardando...' : editingSub ? 'Guardar Cambios' : 'Crear Subcategoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
