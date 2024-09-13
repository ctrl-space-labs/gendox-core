import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { convertFromRaw, convertToRaw, ContentState, EditorState } from 'draft-js';
import documentService from "src/gendox-sdk/documentService";
import authConfig from "src/configs/auth";
import Box from "@mui/material/Box";
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog";
import toast from "react-hot-toast";
import {
  fetchDocument,
  updateSectionsOrder,
} from "src/store/apps/activeDocument/activeDocument";
import EditorConverToMarkdown from "src/views/gendox-components/documents-components/EditorConverToMarkdown";
import { markdownToDraft } from 'markdown-draft-js';

const SectionEdit = ({ section, isMinimized }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  const project = useSelector((state) => state.activeProject.projectDetails);
  const document = useSelector((state) => state.activeDocument.document);
  const [activeSection, setActiveSection] = useState(section);
  const [isSectionMinimized, setIsSectionMinimized] = useState(isMinimized);

  useEffect(() => {
    setIsSectionMinimized(isMinimized);
  }, [isMinimized]);

  // const markdownContent = section.sectionValue || ""; // Assuming this is the markdown from your database
  // const contentState = markdownToDraft(markdownContent);
  // const initialContent = EditorState.createWithContent(
  //   convertFromRaw(contentState)
  // );

  // console.log("initialContent", initialContent);
  // console.log("contentState", contentState);
  // console.log("markdownContent", markdownContent);

  const initialContent = EditorState.createWithContent(
    ContentState.createFromText(section.sectionValue || "")
  );
  const initialTitle = section.documentSectionMetadata.title;
  const [sectionValue, setSectionValue] = useState(initialContent);
  const [sectionTitle, setSectionTitle] = useState(initialTitle);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const lastSavedValue = useRef(sectionValue);
  const lastSavedTitle = useRef(sectionTitle);


  useEffect(() => {
    const intervalId = setInterval(() => {
      if (
        sectionValue !== lastSavedValue.current ||
        sectionTitle !== lastSavedTitle.current
      ) {
        handleSave();
        lastSavedValue.current = sectionValue;
        lastSavedTitle.current = sectionTitle;
      }
    }, 1000); // check every 3 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [sectionValue, sectionTitle]);

  const handleMinimize = () => {
    setIsSectionMinimized(!isSectionMinimized);
  };

  const handleDelete = async () => {
    try {
      const response = await documentService.deleteDocumentSection(
        document.id,
        section.id,
        storedToken
      );
      dispatch(fetchDocument({ documentId: document.id, storedToken })).then(
        () => {
          dispatch(
            updateSectionsOrder({ documentId: document.id, storedToken })
          );
          toast.success("Document Section deleted successfully");
        }
      );
    } catch (error) {
      console.error("Error deleting section", error);
      toast.error("Failed to delete Document Section");
    }
    setConfirmDelete(false);
  };

  const handleDeleteConfirmOpen = () => {
    setConfirmDelete(true);
  };

  const handleDeleteConfirmClose = () => {
    setConfirmDelete(false);
  };

  const handleRestore = () => {
    handleSave();
    setSectionValue(initialContent);
    setSectionTitle(initialTitle);
  };

  const handleSave = async () => {

    // const markdownValue = draftToMarkdown(
    //   convertToRaw(sectionValue.getCurrentContent())
    // );

    const updatedSectionPayload = {
      ...activeSection,
      sectionValue: sectionValue.getCurrentContent().getPlainText() ,
      documentDTO: document,
      documentSectionMetadata: {
        ...activeSection.documentSectionMetadata,
        title: sectionTitle,
      },
    };

    try {
      const response = await documentService.updateDocumentSection(
        document.id,
        section.id,
        updatedSectionPayload,
        storedToken
      );
      dispatch({
        type: 'activeDocument/updateSection', 
        payload: {
          sectionId: section.id,
          updatedSection: response.data,
        }
      });
      setActiveSection(response.data);
    } catch (error) {
      console.error("Error updating section", error);
    }
  };

  return (
    <Box>
      <EditorConverToMarkdown
        sectionValue={sectionValue}
        setSectionValue={setSectionValue}
        sectionTitle={sectionTitle}
        setSectionTitle={setSectionTitle}
        isSectionMinimized={isSectionMinimized}
        handleMinimize={handleMinimize}
        handleRestore={handleRestore}
        handleDeleteConfirmOpen={handleDeleteConfirmOpen}
      />
      <DeleteConfirmDialog
        open={confirmDelete}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleDelete}
        title="Confirm Deletion Document Section"
        contentText={`Are you sure you want to delete ${
          sectionTitle || "this section"
        } from this document? This action cannot be undone.`}
        confirmButtonText="Delete Section"
        cancelButtonText="Cancel"
      />
    </Box>
  );
};

export default SectionEdit;
