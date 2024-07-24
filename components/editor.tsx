"use client";

import { BlockNoteEditor, BlockNoteSchema, defaultStyleSpecs } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  BasicTextStyleButton,
  BlockTypeSelect,
  ColorStyleButton,
  CreateLinkButton,
  FormattingToolbar,
  FormattingToolbarController,
  ImageCaptionButton,
  NestBlockButton,
  ReplaceImageButton,
  TextAlignButton,
  UnnestBlockButton,
  useBlockNoteEditor,
  useComponentsContext,
  useCreateBlockNote,
} from "@blocknote/react";
import { RiText } from "react-icons/ri";
import { useEditorChange } from "@blocknote/react";
import { useEffect, useState, useMemo, VoidFunctionComponent, } from "react";
 
import { Font } from "./Font";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

import { Block, PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";

import "@blocknote/mantine/style.css";

import { useEdgeStore } from "@/lib/edgestore";
import { useTheme } from "next-themes";

 
// Our schema with style specs, which contain the configs and implementations for styles
// that we want our editor to use.
const schema = BlockNoteSchema.create({
  styleSpecs: {
    // Adds all default styles.
    ...defaultStyleSpecs,
    // Adds the Font style.
    font: Font,
  },
});
 
// Formatting Toolbar button to set the font style.
const SetFontStyleButton = () => {
  const editor = useBlockNoteEditor<
    typeof schema.blockSchema,
    typeof schema.inlineContentSchema,
    typeof schema.styleSchema
  >();
 
  const Components = useComponentsContext()!;
 
  return (
    <Components.FormattingToolbar.Button
      label="Set Font"
      mainTooltip={"Set Font"}
      icon={<RiText />}
      onClick={() => {
        const fontName = prompt("Enter a font name") || "Comic Sans MS";
 
        editor.addStyles({
          font: fontName,
        });
      }}
    />
  );
};

async function saveToStorage(documentId: string, jsonBlocks: Block[]) {
    // Save contents to local storage. You might want to debounce this or replace
    // with a call to your API / database.
    localStorage.setItem(`editorContent-${documentId}`, JSON.stringify(jsonBlocks));
}
   
async function loadFromStorage(documentId: string) {
    // Gets the previously stored editor contents.
    const storageString = localStorage.getItem(`editorContent-${documentId}`);
    return storageString
      ? (JSON.parse(storageString) as PartialBlock[])
      : undefined;
}

interface EditorProps {
  documentId : Id<"documents">
  onChange: (value: string) => void;
  editable?: boolean
};

const Editor = ({
  documentId,
  onChange,
  editable = true
}: EditorProps) => {
  const {resolvedTheme} = useTheme()
  const { edgestore } = useEdgeStore();
  const [initialContent, setInitialContent] = useState<
    PartialBlock[] | undefined | "loading"
  >("loading");

  const handleUpload = async (file: File) => {
    const response = await edgestore.publicFiles.upload({
      file
    });
    
    return response.url;
  }

  useEffect(() => {
    loadFromStorage(documentId).then((content) => {
      setInitialContent(content);
    });
  }, [documentId]);
    
    

  // Creates a new editor instance.
  const editor = useMemo(() => {
    if (initialContent === "loading") {
      return undefined;
    }
    return BlockNoteEditor.create({ 
      initialContent, 
      uploadFile: handleUpload, 
    });
  }, [initialContent, documentId]);

 
  if (editor === undefined) {
    return "Loading content...";
  }
  
  

  return (
    <BlockNoteView 
      editor={editor} 
      formattingToolbar={false}
      onChange={() => {
        if (editable){
          saveToStorage(documentId, editor.document);
        }
      }}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      className={!editable ? "editor-readonly" : ""}
    >
      {/* Replaces the default Formatting Toolbar. */}
      {editable && (
        <FormattingToolbarController
          formattingToolbar={() => (
            <FormattingToolbar>
              <BlockTypeSelect key={"blockTypeSelect"} />
  
              <ImageCaptionButton key={"imageCaptionButton"} />
              <ReplaceImageButton key={"replaceImageButton"} />
  
              <BasicTextStyleButton
                basicTextStyle={"bold"}
                key={"boldStyleButton"}
              />
              <BasicTextStyleButton
                basicTextStyle={"italic"}
                key={"italicStyleButton"}
              />
              <BasicTextStyleButton
                basicTextStyle={"underline"}
                key={"underlineStyleButton"}
              />
              <BasicTextStyleButton
                basicTextStyle={"strike"}
                key={"strikeStyleButton"}
              />
              {/* Adds SetFontStyleButton */}
              <SetFontStyleButton />
  
              <TextAlignButton
                textAlignment={"left"}
                key={"textAlignLeftButton"}
              />
              <TextAlignButton
                textAlignment={"center"}
                key={"textAlignCenterButton"}
              />
              <TextAlignButton
                textAlignment={"right"}
                key={"textAlignRightButton"}
              />
  
              <ColorStyleButton key={"colorStyleButton"} />
  
              <NestBlockButton key={"nestBlockButton"} />
              <UnnestBlockButton key={"unnestBlockButton"} />
  
              <CreateLinkButton key={"createLinkButton"} />
            </FormattingToolbar>
          )}
        />
      )}
    </BlockNoteView>
  );
}

export default Editor;