import {EditorState} from '@codemirror/state';
import {EditorView,keymap,lineNumbers,highlightActiveLine,highlightActiveLineGutter,drawSelection} from '@codemirror/view';
import {defaultKeymap,history,historyKeymap} from '@codemirror/commands';
import {sql,SQLite} from '@codemirror/lang-sql';
import {syntaxHighlighting,HighlightStyle,bracketMatching} from '@codemirror/language';
import {tags} from '@lezer/highlight';
import {schema} from './data.js';

const colors=HighlightStyle.define([
 {tag:tags.keyword,color:'#246956',fontWeight:'600'},
 {tag:tags.string,color:'#81551d'},
 {tag:tags.number,color:'#2c657b'},
 {tag:tags.comment,color:'#65716b',fontStyle:'italic'},
 {tag:tags.operator,color:'#246956'},
]);
export function createEditor(parent,doc,onRun,onChange){
 return new EditorView({parent,state:EditorState.create({doc,extensions:[
  lineNumbers(),history(),drawSelection(),highlightActiveLine(),highlightActiveLineGutter(),bracketMatching(),
  sql({dialect:SQLite,schema:Object.fromEntries(schema.map(t=>[t.name,t.fields.map(f=>f[0])]))}),
  syntaxHighlighting(colors),
  keymap.of([{key:'Mod-Enter',run:()=>{onRun();return true;}},...defaultKeymap,...historyKeymap]),
  EditorView.contentAttributes.of({'aria-label':'SQL 查詢編輯器','spellcheck':'false'}),
  EditorView.updateListener.of(u=>{if(u.docChanged)onChange(u.state.doc.toString());}),
  EditorView.theme({
   '&':{fontSize:'14px',backgroundColor:'#f8faf9',color:'#24352e'},
   '.cm-content':{fontFamily:'"IBM Plex Mono", "Microsoft JhengHei", monospace',padding:'18px 0',minHeight:'230px'},
   '.cm-line':{padding:'0 18px 0 10px',lineHeight:'1.8'},
   '.cm-gutters':{backgroundColor:'#f8faf9',color:'#6a756e',border:'none'},
   '.cm-lineNumbers .cm-gutterElement':{padding:'0 10px 0 18px',lineHeight:'1.8',fontFamily:'"IBM Plex Mono", monospace'},
   '.cm-activeLine,.cm-activeLineGutter':{backgroundColor:'#edf2ef'},
   '.cm-cursor':{borderLeftColor:'#246956'},
   '&.cm-focused':{outline:'none'},
   '.cm-selectionBackground,&.cm-focused .cm-selectionBackground':{backgroundColor:'#dce8e1'},
   '.cm-scroller':{overflow:'auto',maxHeight:'420px'},
  }),
 ]})});
}
export function setEditorDoc(editor,doc){editor.dispatch({changes:{from:0,to:editor.state.doc.length,insert:doc}});}
