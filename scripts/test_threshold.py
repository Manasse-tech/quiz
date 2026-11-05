#!/usr/bin/env python3
"""Test API : 10 questions cybersécurité, seuil 60%, WhatsApp pour tous."""
import json
import urllib.request

BASE = "http://localhost:3000"

correct = {
    "c1": "c1o1", "c2": "c2o2", "c3": "c3o1", "c4": "c4o2", "c5": "c5o3",
    "c6": "c6o1", "c7": "c7o2", "c8": "c8o1", "c9": "c9o2", "c10": "c10o3",
}
wrong = {
    "c1": "c1o2", "c2": "c2o1", "c3": "c3o2", "c4": "c4o1", "c5": "c5o1",
    "c6": "c6o2", "c7": "c7o1", "c8": "c8o2", "c9": "c9o1", "c10": "c10o1",
}


def post(path, payload):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def get(path):
    with urllib.request.urlopen(BASE + path) as r:
        return json.loads(r.read())


def run_case(nom, nb_correct):
    reg = post("/api/register", {
        "nom": nom, "prenom": "Test", "email": f"{nom.lower()}@test.ci"
    })
    aid = reg["attemptId"]
    qs = get(f"/api/attempt/start?attemptId={aid}")
    assert len(qs["questions"]) == 10, f"attendu 10 questions, obtenu {len(qs['questions'])}"
    # Aucune option ne doit fuiter la bonne réponse côté client
    for q in qs["questions"]:
        assert "correctOptionId" not in q, f"FUITE de réponse sur {q['id']}"
    ids = [q["id"] for q in qs["questions"]]
    for i, qid in enumerate(ids):
        opt = correct[qid] if i < nb_correct else wrong[qid]
        post("/api/attempt/answer", {
            "attemptId": aid, "questionId": qid, "selectedOptionId": opt
        })
    sub = post("/api/attempt/submit", {"attemptId": aid})
    assert sub["attemptId"] == aid
    res = get(f"/api/attempt/result?attemptId={aid}")
    a = res["attempt"]
    print(f"{nom}: {a['bonnesReponses']}/10 = {a['pourcentage']}% admis={a['admis']} ({a['appreciation']})")
    return a


# 6/10 = 60% → ADMIS (seuil 60%)
a1 = run_case("Limite", 6)
assert a1["pourcentage"] == 60 and a1["admis"] is True, "ERREUR: 60% devrait être admis"

# 5/10 = 50% → NON ADMIS
a2 = run_case("Souslimite", 5)
assert a2["pourcentage"] == 50 and a2["admis"] is False, "ERREUR: 50% ne devrait pas être admis"

# 10/10 = 100% → ADMIS
a3 = run_case("Parfait", 10)
assert a3["pourcentage"] == 100 and a3["admis"] is True

# 0/10 = 0% → NON ADMIS
a4 = run_case("Zero", 0)
assert a4["pourcentage"] == 0 and a4["admis"] is False

# Répartition des domaines : 5 + 5
doms = {d["nom"]: d["totalQuestions"] for d in a3["domaines"]}
print("Domaines:", doms)
assert doms == {
    "Fondamentaux de la cybersécurité": 5,
    "Menaces et bonnes pratiques": 5,
}, "répartition des domaines incorrecte"

# Points forts / faibles du cas 6/10 (c1-c6 corrects → Fondamentaux 5/5, Menaces 1/5)
d1 = {d["nom"]: d for d in a1["domaines"]}
assert d1["Fondamentaux de la cybersécurité"]["pourcentage"] == 100
assert d1["Menaces et bonnes pratiques"]["pourcentage"] == 20
assert a1["pointsForts"] == ["Fondamentaux de la cybersécurité"]
assert a1["pointsFaibles"] == ["Menaces et bonnes pratiques"]

print("\n✅ TOUS LES TESTS PASSENT (10 questions, seuil 60%)")
