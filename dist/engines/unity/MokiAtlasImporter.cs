// Moki Pixel · importador de atlas para Unity (Editor). SIN PROBAR en Unity todavía.
// Uso: copia a Assets/Editor/, selecciona moki-64-right.json en el Project y elige
// Moki → Crear clips desde atlas. Requiere que el PNG esté cortado en rejilla (Sprite Mode Multiple).
#if UNITY_EDITOR
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;

public static class MokiAtlasImporter
{
    [System.Serializable] class Rect { public int x, y, w, h; }
    [System.Serializable] class Tag { public string name; public int from, to; public bool loop; }

    [MenuItem("Moki/Crear clips desde atlas")]
    static void Create()
    {
        var json = Selection.activeObject as TextAsset;
        if (json == null) { Debug.LogWarning("Selecciona el .json del atlas de Moki"); return; }
        var jsonPath = AssetDatabase.GetAssetPath(json);
        var pngPath = Path.ChangeExtension(jsonPath, ".png");
        var sprites = AssetDatabase.LoadAllAssetsAtPath(pngPath).OfType<Sprite>()
            .OrderBy(s => -s.rect.y).ThenBy(s => s.rect.x).ToList(); // orden de rejilla: filas de arriba a abajo
        var root = MiniJSON.Parse(json.text) as Dictionary<string, object>;
        var frames = root["frames"] as Dictionary<string, object>;
        var meta = root["meta"] as Dictionary<string, object>;
        var outDir = Path.Combine(Path.GetDirectoryName(jsonPath), Path.GetFileNameWithoutExtension(jsonPath) + "_clips");
        Directory.CreateDirectory(outDir);
        foreach (Dictionary<string, object> tag in (List<object>)meta["frameTags"])
        {
            int from = System.Convert.ToInt32(tag["from"]), to = System.Convert.ToInt32(tag["to"]);
            var clip = new AnimationClip { frameRate = 12 };
            var binding = new EditorCurveBinding { type = typeof(SpriteRenderer), path = "", propertyName = "m_Sprite" };
            var keys = new List<ObjectReferenceKeyframe>();
            float t = 0;
            for (int i = from; i <= to && i < sprites.Count; i++)
            {
                keys.Add(new ObjectReferenceKeyframe { time = t, value = sprites[i] });
                var f = frames[i.ToString()] as Dictionary<string, object>;
                t += System.Convert.ToSingle(f["duration"]) / 1000f;
            }
            keys.Add(new ObjectReferenceKeyframe { time = t, value = sprites[System.Math.Min(to, sprites.Count - 1)] });
            AnimationUtility.SetObjectReferenceCurve(clip, binding, keys.ToArray());
            var settings = AnimationUtility.GetAnimationClipSettings(clip);
            settings.loopTime = (bool)tag["loop"];
            AnimationUtility.SetAnimationClipSettings(clip, settings);
            AssetDatabase.CreateAsset(clip, Path.Combine(outDir, tag["name"] + ".anim"));
        }
        AssetDatabase.SaveAssets();
        Debug.Log("Clips de Moki creados en " + outDir);
    }
}

// MiniJSON (dominio público, Calvin Rien) reducido a Parse
public static class MiniJSON
{
    public static object Parse(string json) { return new Parser(json).ParseValue(); }
    class Parser
    {
        readonly string s; int i;
        public Parser(string s) { this.s = s; }
        void Ws() { while (i < s.Length && char.IsWhiteSpace(s[i])) i++; }
        public object ParseValue()
        {
            Ws(); char c = s[i];
            if (c == '{') { i++; var d = new Dictionary<string, object>(); Ws(); if (s[i] == '}') { i++; return d; }
                while (true) { Ws(); var k = (string)ParseValue(); Ws(); i++; d[k] = ParseValue(); Ws(); if (s[i++] == '}') return d; } }
            if (c == '[') { i++; var l = new List<object>(); Ws(); if (s[i] == ']') { i++; return l; }
                while (true) { l.Add(ParseValue()); Ws(); if (s[i++] == ']') return l; } }
            if (c == '"') { i++; var sb = new System.Text.StringBuilder();
                while (s[i] != '"') { if (s[i] == '\\') { i++; char e = s[i]; if (e == 'u') { sb.Append((char)System.Convert.ToInt32(s.Substring(i + 1, 4), 16)); i += 4; } else sb.Append(e == 'n' ? '\n' : e == 't' ? '\t' : e); } else sb.Append(s[i]); i++; }
                i++; return sb.ToString(); }
            if (s.Substring(i).StartsWith("true")) { i += 4; return true; }
            if (s.Substring(i).StartsWith("false")) { i += 5; return false; }
            if (s.Substring(i).StartsWith("null")) { i += 4; return null; }
            int st = i; while (i < s.Length && "+-0123456789.eE".IndexOf(s[i]) >= 0) i++;
            return double.Parse(s.Substring(st, i - st), System.Globalization.CultureInfo.InvariantCulture);
        }
    }
}
#endif
