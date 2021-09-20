<template>
    <div v-if="data[id].unlocked || (!data[id].unlocked && displayLockedItems == true)" class="col-12">

        <div v-if="!data[id].unlocked" class="card card-body small">
            <div class="row g-1">
				<div class="col-auto">
					<i class="fas fa-fw fa-lock text-muted"></i>
				</div>
				<div class="col">
					<span class="text-muted">
						{{ $t('locked') }}
						<span v-if="unlocker">
							{{ $t('by') }}
							<span class="text-normal">{{ $t(unlocker) }}</span>
						</span>
					</span>
				</div>
			</div>
        </div>
        
        <div v-if="(data[id].unlocked && data[id].max && data[id].count >= data[id].max) || (spaceshipParts.includes(id) && data['spaceship'].count > 0)" class="card card-body">
            <div class="row g-1">
                <div class="col-auto">
                    <i class="fas fa-fw fa-check text-success"></i>
                </div>
                <div class="col text-truncate">
                    <span class="h6 text-light mb-0">{{ $t(data[id].id) }}</span>
                </div>
                <div class="col-auto">
                    <i class="fas fa-fw fa-eye cursor-hover" data-bs-toggle="collapse" :data-bs-target="'#collapse' + data[id].id"></i>
                </div>
                <div :id="'collapse' + data[id].id" class="col-12 collapse small">
                    <span class="text-normal">{{ $t(data[id].id + '_desc') }}</span>
                </div>
            </div>
        </div>
        
        <div v-if="(spaceshipParts.includes(id) && data[id].count < data[id].max && data['spaceship'].count < 1) || (!spaceshipParts.includes(id) && data[id].unlocked && data[id].max && data[id].count < data[id].max) || (data[id].unlocked && !data[id].max)" class="card card-body">
            
			<div v-if="isCollapsed(id)" class="row gx-3">
                <div class="col-12 col-md-6">
                    <div class="row g-1">
                        <div class="col-auto">
                            <button v-if="collapse" @click="toggleCollapsed(id)" aria-label="Collapse">
                                <i class="fas fa-fw fa-chevron-right"></i>
                            </button>
                        </div>
                        <div class="col">
                            <span class="h6 text-light">{{ $t(data[id].id) }}</span>
                        </div>
                        <div v-if="!data[id].max || data[id].max > 1" class="col-auto">
                            <small class="text-normal me-1">x</small>
                            <span :class="{ 'text-light':data[id].count > 0, 'text-normal':data[id].count <= 0 }">{{ numeralFormat(data[id].count, '0.[0]a') }}</span>
                            <small v-if="data[id].max && data[id].max > 1" class="ms-1 text-normal">/{{ data[id].max }}</small>
                        </div>
                    </div>
                </div>
            </div>
			
            <div v-if="!isCollapsed(id)" class="row gx-3">
			
                <div class="col-12 col-md-6">
                    <div class="row g-3">
                    
                        <div class="col-12">
                            <div class="row g-1">
                                <div class="col-auto">
                                    <button v-if="collapse" @click="toggleCollapsed(id)" aria-label="Collapse">
                                        <i class="fas fa-fw fa-chevron-down"></i>
                                    </button>
                                </div>
                                <div class="col">
                                    <span class="h6 text-light">{{ $t(data[id].id) }}</span>
                                </div>
                                <div v-if="!data[id].max || data[id].max > 1" class="col-auto">
                                    <small class="text-normal me-1">x</small>
                                    <span :class="{ 'text-light':data[id].count > 0, 'text-normal':data[id].count <= 0 }">{{ numeralFormat(data[id].count) }}</span>
                                    <small v-if="data[id].max && data[id].max > 1" class="ms-1 text-normal">/{{ data[id].max }}</small>
                                </div>
                                <div class="col-12 small">
                                    <span class="text-normal">{{ $t(data[id].id + '_desc') }}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div v-if="autoUpgradeStorage && data['techAutoStorageUpgrade'].count > 0" class="col-12">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" :id="'auto' + id" v-model="automated" @click="setAutoStorageUpgrade({ id:id, auto:!automated })" />
                                <label class="form-check-label small" :for="'auto' + id">{{ $t('auto') }}</label>
                            </div>
                        </div>
                        
                        <div v-if="data['techDestruction'].count > 0 && data[id].destroyable" class="col-12">
                            <div class="row g-1">
                                <div class="col-auto">
                                    <button class="btn btn-danger" @click="destroy({id:id, count:1})">
                                        <span class="text-danger">{{ $t('destroy') }}</span>
                                    </button>
                                </div>
                                <div v-if="multibuy == true" class="col-auto">
                                    <button class="btn btn-danger" @click="destroy({id:id, count:10000})">
                                        <span class="text-danger">{{ $t('nukeAll') }}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    
                        <div v-if="data[id].problem" class="col-12 small">
                            <i class="fas fa-fw fa-exclamation-triangle text-danger"></i>
                            <span class="text-danger ms-1">{{ $t(data[id].problem.type) }}</span>
                            <span class="text-light ms-1">{{ $t(data[id].problem.id) }}</span>
                        </div>
                            
                        <div v-if="id == 'nanoswarm'" class="col-12">
                            <div class="small">{{ $t('selectResource') }}</div>
                            <select class="form-control" v-model="selected" @change="switchNano(selected)">
                                <option value="energy">{{ $t('energy') }}</option>
                                <option value="plasma">{{ $t('plasma') }}</option>
                                <option value="meteorite">{{ $t('meteorite') }}</option>
                                <option value="carbon">{{ $t('carbon') }}</option>
                                <option value="oil">{{ $t('oil') }}</option>
                                <option value="metal">{{ $t('metal') }}</option>
                                <option value="gem">{{ $t('gem') }}</option>
                                <option value="wood">{{ $t('wood') }}</option>
                                <option value="silicon">{{ $t('silicon') }}</option>
                                <option value="uranium">{{ $t('uranium') }}</option>
                                <option value="lava">{{ $t('lava') }}</option>
                                <option value="lunarite">{{ $t('lunarite') }}</option>
                                <option value="methane">{{ $t('methane') }}</option>
                                <option value="titanium">{{ $t('titanium') }}</option>
                                <option value="gold">{{ $t('gold') }}</option>
                                <option value="silver">{{ $t('silver') }}</option>
                                <option value="hydrogen">{{ $t('hydrogen') }}</option>
                                <option value="helium">{{ $t('helium') }}</option>
                                <option value="ice">{{ $t('ice') }}</option>
                                <option value="science">{{ $t('science') }}</option>
                                <option value="fuel">{{ $t('fuel') }}</option>
                                <option value="antimatter">{{ $t('antimatter') }}</option>
                            </select>
                        </div>
                        <div v-if="id == 'nanoswarm'" class="col-12">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="checkNanoswarmShortcut" v-model="showNanoswarmShortcut" @click="setDisplayNanoswarmShortcut(!showNanoswarmShortcut)" />
                                <label class="form-check-label small" for="checkNanoswarmShortcut">{{ $t('showNanoswarmShortcut') }}</label>
                            </div>
                        </div>
                    </div>
                </div>
                    
                <div class="col-12 col-md-6">
                    <div class="row g-3">
					
						<div v-if="data[id].stats" class="col-12">
							<div class="heading-6">{{ $t('stats') }}</div>
							<div class="row g-1 gx-3">
								<div class="col-auto">
									<span class="small text-normal">{{ $t('power') }}</span>
									<span class="ms-2 text-light">{{ numeralFormat(data[id].stats.power, '0.[0]a') }}</span>
								</div>
								<div class="col-auto">
									<span class="small text-normal">{{ $t('defense') }}</span>
									<span class="ms-2 text-light">{{ numeralFormat(data[id].stats.defense, '0.[0]a') }}</span>
								</div>
								<div class="col-auto">
									<span class="small text-normal">{{ $t('speed') }}</span>
									<span class="ms-2 text-light">{{ numeralFormat(data[id].stats.speed, '0.[0]a') }}</span>
								</div>
							</div>
						</div>
								
						<div v-if="data[id].storage && data[id].storage.count > 0" class="col-12">
							<div class="heading-6">{{ $t('storage') }}</div>
							<div class="row g-1">
								<div class="col">
									<button class="small" @click="setActivePane(data[id].storage.id + 'Pane')">
										<div class="row g-1">
											<div class="col-auto d-flex align-items-center">
												<img :src="require(`../assets/interface/${data[id].storage.id}.png`)" width="12" height="12" :alt="$t(data[id].storage.id) + ' icon'" />
											</div>
											<div class="col">
												<span class="text-normal">{{ $t(data[id].storage.id) }}</span>
											</div>
										</div>
									</button>
								</div>
								<div class="col-auto">
									<small v-if="data[id].storage.id != 'energy'" class="text-success text-uppercase">+{{ numeralFormat(data[id].storage.count.toPrecision(4), '0.[000]a') }}</small>
									<small v-if="data[id].storage.id == 'energy'" class="text-success text-uppercase">+{{ numeralFormat((data[id].storage.count * (1 + (0.01 * data['boostEnergyStorage'].count))).toPrecision(4), '0.[000]a') }}</small>
								</div>
							</div>
						</div>
                        
                        <div v-if="data[id].outputs" class="col-12">
                            <div class="heading-6">{{ $t('production') }}</div>
                            <div v-for="output in data[id].outputs" :key="output.id" class="row g-1">
                                <div class="col">
                                    <button class="small" @click="setActivePane(output.id + 'Pane')">
                                        <div class="row g-1">
                                            <div class="col-auto d-flex align-items-center">
                                                <img :src="require(`../assets/interface/${output.id}.png`)" width="12" height="12" :alt="$t(output.id) + ' icon'" />
                                            </div>
                                            <div class="col">
                                                <span class="text-normal">{{ $t(output.id) }}</span>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                                <div class="col-auto">
                                    <small class="text-success text-uppercase">+{{ numeralFormat((output.count * data[output.id].boost).toPrecision(4), '0.[000]a') }}</small>
                                    <small class="text-normal ms-1">/s</small>
                                </div>
                            </div>
                            <div v-for="input in data[id].inputs" :key="input.id" class="row g-1">
                                <div class="col">
                                    <button class="small" @click="setActivePane(input.id + 'Pane')">
                                        <div class="row g-1">
                                            <div class="col-auto d-flex align-items-center">
                                                <img :src="require(`../assets/interface/${input.id}.png`)" width="12" height="12" :alt="$t(input.id) + ' icon'" />
                                            </div>
                                            <div class="col">
                                                <span class="text-normal">{{ $t(input.id) }}</span>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                                <div class="col-auto">
                                    <small v-if="input.id == 'energy'" class="text-warning text-uppercase">-{{ numeralFormat((input.count * (1 - (0.01 * data['boostEnergy'].count))).toPrecision(4), '0.[000]a') }}</small>
                                    <small v-if="input.id != 'energy'" class="text-warning text-uppercase">-{{ numeralFormat(input.count.toPrecision(4), '0.[000]a') }}</small>
                                    <small class="text-normal ms-1">/s</small>
                                </div>
                            </div>
                        </div>
					
                        <costs :costs="data[id].costs" :id="id" :calc="calc" />
                        
                        <div class="col-12">
                            <div v-if="id != 'segment'" class="row g-1 justify-content-end">
                                <div v-if="multibuy == true && data[id].count < 5" class="col-auto"><button class="btn px-2" @click="build({id:id, upto:5})">= 5</button></div>
                                <div v-if="multibuy == true && data[id].count < 25" class="col-auto"><button class="btn px-2" @click="build({id:id, upto:25})">= 25</button></div>
                                <div v-if="multibuy == true && data[id].count < 75" class="col-auto"><button class="btn px-2" @click="build({id:id, upto:75})">= 75</button></div>
                                <div v-if="multibuy == true && data[id].count < 150" class="col-auto"><button class="btn px-2" @click="build({id:id, upto:150})">= 150</button></div>
                                <div v-if="multibuy == true && data[id].count < 250" class="col-auto"><button class="btn px-2" @click="build({id:id, upto:250})">= 250</button></div>
                                <div v-if="id == 'dysonT1'" class="col-auto"><button class="btn" @click="build({id:'segment', upto:50});build({id:'dysonT1', count:1});">{{ $t('btnDysonT1') }}</button></div>
                                <div v-if="id == 'dysonT2'" class="col-auto"><button class="btn" @click="build({id:'segment', upto:100});build({id:'dysonT2', count:1});">{{ $t('btnDysonT2') }}</button></div>
                                <div v-if="id == 'dysonT3'" class="col-auto"><button class="btn" @click="build({id:'segment', upto:250});build({id:'dysonT3', count:1});">{{ $t('btnDysonT3') }}</button></div>
                                <div v-if="multibuy == true" class="col-auto"><button class="btn px-2" @click="build({id:id, count:1})">+ 1</button></div>
                                <div v-if="multibuy != true" class="col-auto"><button class="btn" @click="build({id:id, count:1})">{{ $t(btnText) }}</button></div>
                            </div>
                            <div v-if="id == 'segment'" class="row g-1 justify-content-end">
                                <div class="col-auto"><button class="btn px-2" @click="build({id:id, upto:50})">= 50</button></div>
                                <div class="col-auto"><button class="btn px-2" @click="build({id:id, upto:100})">= 100</button></div>
                                <div class="col-auto"><button class="btn px-2" @click="build({id:id, upto:250})">= 250</button></div>
                                <div class="col-auto"><button class="btn px-2" @click="build({id:id, count:1})">+ 1</button></div>
                            </div>
                        </div>
                        
                    </div>
                </div>
				
            </div>
        </div>
        
    </div>
</template>

<script>
import Costs from './Costs.vue'

import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'

export default {
    props: [ 'id', 'btnText', 'unlocker', 'collapse', 'multibuy', 'calc', 'autoUpgradeStorage' ],
    components: {
        'costs': Costs,
    },
    data() {
        return {
            selected: null,
            automated: null,
            spaceshipParts: ['shield', 'engine', 'aero'],
        }
    },
    created() {
        this.selected = this.id == 'nanoswarm' ? this.data[this.id].resource : null
        this.automated = this.data[this.id].auto ? this.data[this.id].auto : null
    },
    computed: {
        ...mapState([
            'data', 'displayLockedItems', 'displayNanoswarmShortcut' 
        ]),
        ...mapGetters([
            'isCollapsed'
        ]),
        showNanoswarmShortcut: function(){return this.displayNanoswarmShortcut},
    },
    methods: {
        ...mapActions([
            'build', 'destroy', 'switchNano',
        ]),
        ...mapMutations([
            'toggleCollapsed', 'setAutoStorageUpgrade', 'setActivePane', 'setDisplayNanoswarmShortcut',
        ]),
    },
}
</script>