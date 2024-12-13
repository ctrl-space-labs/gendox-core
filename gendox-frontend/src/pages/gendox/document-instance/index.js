import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Icon from "src/@core/components/icon";
import toast from "react-hot-toast";
import { formatDocumentTitle } from "src/utils/documentUtils";
import {
  fetchDocument,
  updateSectionsOrder,
} from "src/store/apps/activeDocument/activeDocument";
import { StyledCardContent } from "src/utils/styledCardsContent";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import authConfig from "src/configs/auth";
import SectionCard from "src/views/gendox-components/documents-components/SectionCard";
import SectionEdit from "src/views/gendox-components/documents-components/SectionEdit";
import documentService from "src/gendox-sdk/documentService";

const DocumentSections = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { documentId, sectionId } = router.query;
  const storedToken = localStorage.getItem(authConfig.storageTokenKeyName);
  const document = useSelector((state) => state.activeDocument.document);
  const sections = useSelector((state) => state.activeDocument.sections);

  const [editMode, setEditMode] = useState(false);
  const [areAllMinimized, setAreAllMinimized] = useState(false);
  const [highlightedSectionId, setHighlightedSectionId] = useState(null);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false); // state for fake loading when user drag sections
  const [isBlurring, setIsBlurring] = useState(false); // state for blur when user press back button

  const sectionRefs = useRef([]);
  const [targetIndex, setTargetIndex] = useState(null);
  const sectionCardRef = useRef(null);


  const scrollToSectionOrderByOrderNumber = (order) => {
    const sectionIndex = sections.findIndex(
      (section) => section.documentSectionMetadata.sectionOrder === order
    );
    if (sectionIndex !== -1) {
      setTargetIndex(sectionIndex); // Set the targetIndex to the found section index
    }
  };

  const scrollToSectionOrderBySectionid = (sectionId) => {
    const sectionIndex = sections.findIndex(
      (section) => section.id === sectionId
    );
    if (sectionIndex !== -1) {
      setTargetIndex(sectionIndex); // Set the targetIndex to the found section index
    }
  };

  const scrollToAndHighlightSection = (id) => {
    const sectionIndex = sections.findIndex((section) => section.id === id);
    if (sectionIndex !== -1 ) {
      setHighlightedSectionId(id); // Highlight the section
      sectionRefs?.current[sectionIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Remove the highlight after 10 seconds
      setTimeout(() => setHighlightedSectionId(null), 10000);
    }
  };

  useEffect(() => {
    if (targetIndex !== null && sectionCardRef.current) {
      sectionCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [targetIndex]);

  useEffect(() => {
    const fragment = router.asPath.split("#")[1];
    if (fragment && !editMode) {
      const sectionOrder = parseInt(fragment, 10);
      if (!isNaN(sectionOrder)) {
        scrollToSectionOrderByOrderNumber(sectionOrder);
      }
    }
  }, [sections, router.asPath, editMode]);

  useEffect(() => {
    if (sectionId && sections.length > 0) {
      scrollToSectionOrderBySectionid(sectionId);
    }
  }, [sectionId, sections]);

  useEffect(() => {
    if (sectionId && sections.length > 0) {
      scrollToAndHighlightSection(sectionId);
    }
  }, [sectionId, sections]);

  useEffect(() => {
    fetchSectionsRow(sections);
  }, [dispatch, sections]);

  const fetchSectionsRow = (sections) => {
    const updatedSectionPayload = sections.reduce((acc, section, index) => {
      const newOrder = index + 1; // Assuming sectionOrder starts from 1
      if (section.documentSectionMetadata.sectionOrder !== newOrder) {
        acc.push({
          sectionId: section.id,
          documentSectionMetadataId: section.documentSectionMetadata.id,
          sectionOrder: newOrder,
        });
      }
      return acc;
    }, []);

    // Only dispatch if there are updates to be made
    if (updatedSectionPayload.length > 0) {
      setIsUpdatingOrder(true); // Start fake loading
      dispatch(
        updateSectionsOrder({ documentId, updatedSectionPayload, storedToken })
      ).then(() => {
        // Reload the document after updating the order
        dispatch(fetchDocument({ documentId, storedToken }));
        setIsUpdatingOrder(false); // Stop fake loading
      });
    }
  };

  useEffect(() => {
    setIsBlurring(true);
    const loadData = () => {
      if (!document || document.id !== documentId) {
        dispatch(
          fetchDocument({
            documentId,
            storedToken,
          })
        );
      }
      setTimeout(() => {
        setIsBlurring(false);
      }, 300);
    };
    loadData();
  }, [documentId, document, dispatch, storedToken, sections]);

  const handleToggleEdit = () => {
    if (!editMode) {
      setIsBlurring(true);
      dispatch(fetchDocument({ documentId, storedToken }));
      setTimeout(() => {
        setIsBlurring(false);
      }, 300);
    }
    setEditMode(!editMode);
  };

  const handleToggleMinimizeAll = () => {
    setAreAllMinimized(!areAllMinimized);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) {
      return;
    }
    const reorderedSections = Array.from(sections);
    const [movedSection] = reorderedSections.splice(result.source.index, 1);
    reorderedSections.splice(result.destination.index, 0, movedSection);

    fetchSectionsRow(reorderedSections);
  };

  const addNewSection = async () => {
    try {
      const response = await documentService.createDocumentSection(
        document.id,
        storedToken
      );
      // dispatch(fetchDocument({ documentId: document.id, storedToken }));
      dispatch(fetchDocument({ documentId: document.id, storedToken })).then(
        () => {
          const lastIndex = sections.length; // Since a new section is added, use the updated length
          if (sectionRefs.current[lastIndex]) {
            sectionRefs.current[lastIndex].scrollIntoView({
              behavior: "smooth",
            });
          }
        }
      );

      toast.success("New Document Section created successfully");
    } catch (error) {
      console.error("Error creating new section", error);
      toast.error("Failed to create new Document Section");
    }
  };

  const assignRefs =
    (...refs) =>
    (element) => {
      refs.forEach((ref) => {
        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      });
    };

  const IconButtons = () => (
    <Box sx={{ display: "inline-flex", gap: 1 }}>
      {!editMode ? (
        <Tooltip title="Edit Document Sections">
          <IconButton
            onClick={handleToggleEdit}
            sx={{
              mb: 6,
              width: "auto",
              height: "auto",
              color: "primary.main",
            }}
          >
            <Icon icon="mdi:pencil-outline" />
          </IconButton>
        </Tooltip>
      ) : (
        <>
          <Tooltip title="Back">
            <IconButton
              onClick={handleToggleEdit}
              sx={{
                mb: 6,
                width: "auto",
                height: "auto",
                color: "primary.main",
              }}
            >
              <Icon icon="mdi:arrow-left-bold" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add new Section">
            <IconButton
              onClick={addNewSection}
              sx={{
                mb: 6,
                width: "auto",
                height: "auto",
                color: "primary.main",
              }}
            >
              <Icon icon="mdi:tab-plus" />
            </IconButton>
          </Tooltip>
          <Tooltip title={areAllMinimized ? "Maximize All" : "Minimize All"}>
            <IconButton
              onClick={handleToggleMinimizeAll}
              sx={{
                mb: 6,
                width: "auto",
                height: "auto",
                color: "primary.main",
              }}
            >
              <Icon
                icon={
                  areAllMinimized ? "mdi:arrow-expand" : "mdi:arrow-collapse"
                }
              />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Box>
  );


  return (
    <Card sx={{ backgroundColor: "transparent", boxShadow: "none" }}>
      <StyledCardContent sx={{ backgroundColor: "background.paper" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h4"
            sx={{ mb: 6, fontWeight: 600, textAlign: "left" }}
          >
            {document
              ? formatDocumentTitle(document.remoteUrl)
              : "No Selected Document"}{" "}
            Document
          </Typography>
          <IconButtons />
        </Box>
      </StyledCardContent>
      <Box sx={{ height: 20 }} />
      {!editMode ? (
        <StyledCardContent
          sx={{
            backgroundColor: "action.selected",
            border: sectionId === highlightedSectionId ? "2px solid" : "none",
            borderColor:
              sectionId === highlightedSectionId
                ? "primary.main"
                : "transparent",
            pt: 3,
            pb: 3,
            mb: 6,
            filter: isBlurring ? "blur(6px)" : "none", // Apply blur to SectionCard
            transition: "filter 0.3s ease",
          }}
        >
          <SectionCard
            ref={sectionCardRef}
            targetIndex={targetIndex}
            highlightedSectionId={highlightedSectionId}
          />
        </StyledCardContent>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {sections.map((section, index) => (
                  <Draggable
                    key={section.id}
                    draggableId={section.id}
                    index={index}
                  >
                    {(provided) => (
                      <StyledCardContent
                        ref={assignRefs(
                          provided.innerRef,
                          (el) => (sectionRefs.current[index] = el)
                        )}
                        {...provided.draggableProps}
                        // {...provided.dragHandleProps}
                        sx={{
                          backgroundColor:
                            section.id === highlightedSectionId
                              ? "action.selected"
                              : "background.paper", // Highlight if a section is selected
                          border:
                            section.id === highlightedSectionId
                              ? "2px solid"
                              : "none",
                          borderColor:
                            section.id === highlightedSectionId
                              ? "primary.main"
                              : "transparent",
                          mb: 6,
                          filter: isUpdatingOrder ? "blur(6px)" : "none", // Apply blur during loading
                          transition: "filter 0.3s ease", // Smooth transition for blur
                        }}
                      >
                        <Grid
                          container
                          justifyContent={"space-between"}
                          display={"flex"}
                          alignItems={"center"}
                        >
                          <Grid item xs={11} {...provided.dragHandleProps}>
                            <SectionEdit
                              section={section}
                              isMinimized={areAllMinimized}
                            />
                          </Grid>
                          <Grid item xs={1} container justifyContent="flex-end">
                            <Tooltip title="Drag">
                              <IconButton
                                sx={{
                                  p: 1,
                                  color: "primary.main",
                                  cursor: "grab",
                                }}
                                {...provided.dragHandleProps}
                              >
                                <Icon icon="mdi:drag-horizontal-variant" />
                              </IconButton>
                            </Tooltip>
                          </Grid>
                        </Grid>
                      </StyledCardContent>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      <Box
        sx={{
          py: 2,
          backgroundColor: "action.hover",
          textAlign: "center",
        }}
      >
        <IconButtons />
      </Box>
    </Card>
  );
};

export default DocumentSections;
