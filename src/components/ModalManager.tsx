import { useCallback } from 'react';
import { Modal } from './Modal';
import { useSkillStore } from '../store/skillStore';

const INVALID_CHARS = /[<>:"|?*\\]/;

function validateFileName(name: string, existingFiles: Map<string, string>, parentPath: string): string | null {
  if (INVALID_CHARS.test(name)) {
    return 'Name contains invalid characters: < > : " | ? * \\'
  }
  if (name.startsWith('.') && name !== '.gitkeep') {
    return 'Name cannot start with a dot'
  }
  if (name.includes('/')) {
    return 'Name cannot contain slashes'
  }
  const fullPath = parentPath ? `${parentPath}/${name}` : name;
  if (existingFiles.has(fullPath)) {
    return 'A file with this name already exists'
  }
  return null;
}

function validateFolderName(name: string, existingFiles: Map<string, string>, parentPath: string): string | null {
  if (INVALID_CHARS.test(name)) {
    return 'Name contains invalid characters: < > : " | ? * \\'
  }
  if (name.includes('/')) {
    return 'Name cannot contain slashes'
  }
  const prefix = parentPath ? `${parentPath}/${name}/` : `${name}/`;
  for (const key of existingFiles.keys()) {
    if (key.startsWith(prefix)) {
      return 'A folder with this name already exists'
    }
  }
  return null;
}

export function ModalManager() {
  const { modal, setModal, files, createFile, createFolder, renameFile } = useSkillStore();

  const handleClose = useCallback(() => setModal(null), [setModal]);

  if (!modal) return null;

  if (modal.type === 'new-file') {
    return (
      <Modal
        title="New File"
        placeholder="filename.md"
        submitLabel="Create"
        validate={(name) => validateFileName(name, files, modal.parentPath)}
        onSubmit={(name) => {
          createFile(modal.parentPath, name);
          setModal(null);
        }}
        onClose={handleClose}
      />
    );
  }

  if (modal.type === 'new-folder') {
    return (
      <Modal
        title="New Folder"
        placeholder="folder-name"
        submitLabel="Create"
        validate={(name) => validateFolderName(name, files, modal.parentPath)}
        onSubmit={(name) => {
          createFolder(modal.parentPath, name);
          setModal(null);
        }}
        onClose={handleClose}
      />
    );
  }

  if (modal.type === 'rename') {
    return (
      <Modal
        title="Rename"
        defaultValue={modal.defaultValue}
        submitLabel="Rename"
        validate={(name) => {
          if (name === modal.defaultValue) return null;
          return validateFileName(name, files, modal.parentPath);
        }}
        onSubmit={(name) => {
          if (modal.originalPath) {
            const parts = modal.originalPath.split('/');
            parts[parts.length - 1] = name;
            renameFile(modal.originalPath, parts.join('/'));
          }
          setModal(null);
        }}
        onClose={handleClose}
      />
    );
  }

  return null;
}
