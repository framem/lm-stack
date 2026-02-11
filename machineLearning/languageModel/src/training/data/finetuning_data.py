"""
Fine-tuning data for teaching new knowledge to the model.

These sentences contain topics that were NOT present in the original training:
- Weather (wind, snow, clouds, storm)
- Food/cooking (soup, cake, bread, butter)
"""

# Fine-Tuning-Daten (neues Wissen, das nachtrainiert wird)
FINETUNING_DATA = [
    "der wind weht über das feld",
    "der schnee fällt im winter",
    "die wolken ziehen am himmel",
    "der sturm kommt aus dem norden",
    "die suppe kocht auf dem herd",
    "der kuchen steht im ofen",
    "das brot liegt auf dem tisch",
    "die butter schmilzt in der pfanne",
]
